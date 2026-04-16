import { StatusCodes } from "http-status-codes";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/tokens.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : req.cookies.accessToken;

  if (!token) throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required");

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub)
    .select("+refreshTokenHash")
    .populate("customRole", "name description permissions isActive");

  if (!user || user.status === "suspended") {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Account is unavailable");
  }

  req.user = user;
  next();
});

export const optionalProtect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : req.cookies.accessToken;

  if (!token) {
    next();
    return;
  }

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub)
    .select("+refreshTokenHash")
    .populate("customRole", "name description permissions isActive");

  if (!user || user.status === "suspended") {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Account is unavailable");
  }

  req.user = user;
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, "Access denied"));
  }
  next();
};
