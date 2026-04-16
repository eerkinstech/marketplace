import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { env } from "../../config/env.js";
import { User } from "../../models/User.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { slugify } from "../../utils/slugify.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../../utils/tokens.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  status: user.status,
  customRole: user.customRole
    ? {
        _id: user.customRole._id,
        name: user.customRole.name,
        description: user.customRole.description || "",
        permissions: Array.isArray(user.customRole.permissions) ? user.customRole.permissions : [],
        isActive: user.customRole.isActive !== false
      }
    : null,
  storeName: user.storeName,
  storeSlug: user.storeSlug,
  addresses: Array.isArray(user.addresses)
    ? user.addresses.map((address) => ({
        label: address.label || "",
        fullName: address.fullName || "",
        phone: address.phone || "",
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        country: address.country || "",
        postalCode: address.postalCode || "",
        isDefault: Boolean(address.isDefault)
      }))
    : []
});

function normalizeShippingAddress(payload = {}) {
  const hasValue = [payload.fullName, payload.phone, payload.street, payload.city, payload.state, payload.country, payload.postalCode]
    .some((value) => Boolean(value && String(value).trim()));

  if (!hasValue) {
    return null;
  }

  return {
    label: "Saved shipping address",
    fullName: payload.fullName || "",
    phone: payload.phone || "",
    street: payload.street || "",
    city: payload.city || "",
    state: payload.state || "",
    country: payload.country || "",
    postalCode: payload.postalCode || "",
    isDefault: true
  };
}

const setAuthCookies = (res, accessToken, refreshToken) => {
  if (env.nodeEnv === "development") {
    return;
  }

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 15 * 60 * 1000
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};

export const register = asyncHandler(async (req, res) => {
  const payload = req.validatedBody;
  const exists = await User.findOne({ email: payload.email });
  if (exists) throw new ApiError(StatusCodes.CONFLICT, "Email already registered");

  const role = payload.role;
  const storeSlug = role === "vendor" ? slugify(payload.storeName) : undefined;

  const user = await User.create({
    ...payload,
    role,
    status: role === "vendor" ? "pending" : "active",
    storeSlug
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: role === "vendor" ? "Vendor registration submitted for approval" : "Account created",
    data: {
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedBody;
  const user = await User.findOne({ email }).select("+password +refreshTokenHash");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  if (user.status === "suspended") {
    throw new ApiError(StatusCodes.FORBIDDEN, "Account suspended");
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);
  res.json({
    success: true,
    data: { user: sanitizeUser(user), accessToken, refreshToken }
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token required");

  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user || !user.refreshTokenHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid session");
  }

  const isValid = await bcrypt.compare(token, user.refreshTokenHash);
  if (!isValid) throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid session");

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);
  res.json({ success: true, data: { accessToken, refreshToken } });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    req.user.refreshTokenHash = undefined;
    req.user.tokenVersion += 1;
    await req.user.save();
  }

  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  res.json({ success: true, message: "Logged out" });
});

export const profile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: sanitizeUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const payload = req.validatedBody;

  if (payload.email && payload.email.toLowerCase() !== req.user.email) {
    const existing = await User.findOne({
      email: payload.email.toLowerCase(),
      _id: { $ne: req.user._id }
    }).lean();

    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
    }
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (payload.name) {
    user.name = payload.name;
  }
  if (payload.email) {
    user.email = payload.email.toLowerCase();
  }
  if (typeof payload.phone !== "undefined") {
    user.phone = payload.phone || "";
  }

  if (payload.shippingAddress) {
    const shippingAddress = normalizeShippingAddress(payload.shippingAddress);
    if (shippingAddress) {
      user.addresses = [shippingAddress];
    }
  }

  await user.save();

  res.json({
    success: true,
    message: "Profile updated",
    data: sanitizeUser(user)
  });
});
