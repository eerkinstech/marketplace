import { StatusCodes } from "http-status-codes";
import { Category } from "../models/Category.js";
import { HomeSection } from "../models/HomeSection.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { slugify } from "../utils/slugify.js";

function normalizeSectionPayload(payload) {
  return {
    name: String(payload.name || "").trim(),
    slug: slugify(payload.slug || payload.name),
    sectionType: payload.sectionType,
    order: Number(payload.order || 0),
    isActive: payload.isActive !== false,
    eyebrow: payload.eyebrow || "",
    title: payload.title || "",
    subtitle: payload.subtitle || "",
    description: payload.description || "",
    ctaLabel: payload.ctaLabel || "",
    ctaHref: payload.ctaHref || "",
    theme: payload.theme || "dark",
    backgroundColor: payload.backgroundColor || "",
    textColor: payload.textColor || "",
    accentColor: payload.accentColor || "",
    imageUrl: payload.imageUrl || "",
    mobileImageUrl: payload.mobileImageUrl || "",
    limit: Number(payload.limit || 6),
    categoryIds: Array.isArray(payload.categoryIds) ? payload.categoryIds.filter(Boolean) : [],
    productIds: Array.isArray(payload.productIds) ? payload.productIds.filter(Boolean) : [],
    items: Array.isArray(payload.items) ? payload.items.map((item) => ({
      eyebrow: item.eyebrow || "",
      title: item.title || "",
      subtitle: item.subtitle || "",
      description: item.description || "",
      label: item.label || "",
      href: item.href || "",
      imageUrl: item.imageUrl || "",
      mobileImageUrl: item.mobileImageUrl || "",
      backgroundColor: item.backgroundColor || "",
      textColor: item.textColor || "",
      accentColor: item.accentColor || "",
      badge: item.badge || ""
    })) : []
  };
}

async function buildSectionResponse(section) {
  const data = section.toObject ? section.toObject() : section;

  let categories = [];
  if (Array.isArray(data.categoryIds) && data.categoryIds.length) {
    categories = await Category.find({ _id: { $in: data.categoryIds }, isActive: true })
      .sort("name")
      .lean();
  }

  let selectedProducts = [];
  if (Array.isArray(data.productIds) && data.productIds.length) {
    const products = await Product.find({ _id: { $in: data.productIds }, status: "approved" })
      .populate("vendor", "storeName storeSlug")
      .populate("category", "name slug")
      .lean();
    const productMap = new Map(products.map((product) => [String(product._id), product]));
    selectedProducts = data.productIds.map((id) => productMap.get(String(id))).filter(Boolean);
  } else if (
    Array.isArray(data.categoryIds) &&
    data.categoryIds.length &&
    ["product_carousel", "product_grid"].includes(data.sectionType)
  ) {
    selectedProducts = await Product.find({
      status: "approved",
      category: { $in: data.categoryIds }
    })
      .sort("-isFeatured -createdAt")
      .limit(Number(data.limit || 6))
      .populate("vendor", "storeName storeSlug")
      .populate("category", "name slug")
      .lean();
  }

  return {
    ...data,
    categories,
    products: selectedProducts
  };
}

export const listAdminHomeSections = asyncHandler(async (_req, res) => {
  const sections = await HomeSection.find().sort("order createdAt").lean();
  res.json({ success: true, data: sections });
});

export const createAdminHomeSection = asyncHandler(async (req, res) => {
  const payload = normalizeSectionPayload(req.validatedBody);
  const existing = await HomeSection.findOne({ slug: payload.slug }).lean();
  if (existing) throw new ApiError(StatusCodes.CONFLICT, "A homepage section with this slug already exists.");

  const section = await HomeSection.create(payload);
  res.status(StatusCodes.CREATED).json({ success: true, data: section });
});

export const updateAdminHomeSection = asyncHandler(async (req, res) => {
  const section = await HomeSection.findById(req.params.id);
  if (!section) throw new ApiError(StatusCodes.NOT_FOUND, "Homepage section not found");

  const payload = normalizeSectionPayload(req.validatedBody);
  const existing = await HomeSection.findOne({ slug: payload.slug, _id: { $ne: section._id } }).lean();
  if (existing) throw new ApiError(StatusCodes.CONFLICT, "A homepage section with this slug already exists.");

  Object.assign(section, payload);
  await section.save();

  res.json({ success: true, data: section });
});

export const deleteAdminHomeSection = asyncHandler(async (req, res) => {
  const section = await HomeSection.findByIdAndDelete(req.params.id);
  if (!section) throw new ApiError(StatusCodes.NOT_FOUND, "Homepage section not found");
  res.json({ success: true, message: "Homepage section deleted" });
});

export const listPublicHomeSections = asyncHandler(async (_req, res) => {
  const sections = await HomeSection.find({ isActive: true }).sort("order createdAt");
  const payload = [];

  for (const section of sections) {
    payload.push(await buildSectionResponse(section));
  }

  res.json({ success: true, data: payload });
});
