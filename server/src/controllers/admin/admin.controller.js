import { StatusCodes } from "http-status-codes";
import { Announcement } from "../../models/Announcement.js";
import { Category } from "../../models/Category.js";
import { Conversation } from "../../models/Conversation.js";
import { Coupon } from "../../models/Coupon.js";
import { Menu } from "../../models/Menu.js";
import { MenuSettings } from "../../models/MenuSettings.js";
import { Message } from "../../models/Message.js";
import { Order } from "../../models/Order.js";
import { Page } from "../../models/Page.js";
import { Product } from "../../models/Product.js";
import { Redirect } from "../../models/Redirect.js";
import { Role } from "../../models/Role.js";
import { ReturnRequest } from "../../models/ReturnRequest.js";
import { Review } from "../../models/Review.js";
import { ReviewSettings } from "../../models/ReviewSettings.js";
import { SeoPage } from "../../models/SeoPage.js";
import { User } from "../../models/User.js";
import { uploadBufferImage } from "../../services/storage/upload.service.js";
import { syncMediaLibraryImages } from "../../services/media/syncMediaLibrary.service.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { DESIGNED_SEO_PAGE_KEYS, ensureDesignedSeoPages } from "../../utils/designedSeoPages.js";
import { isExternalRedirectTarget, normalizeRedirectPath } from "../../utils/redirects.js";
import { slugify } from "../../utils/slugify.js";

async function resolveCategory(categoryId) {
  const category = await Category.findById(categoryId);
  if (!category) throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid category");
  return category;
}

async function resolveCategories(categoryIds = []) {
  const normalizedIds = [...new Set((categoryIds || []).filter(Boolean).map(String))];
  if (!normalizedIds.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "At least one category is required");
  }

  const categories = await Category.find({ _id: { $in: normalizedIds } });
  if (categories.length !== normalizedIds.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "One or more categories are invalid");
  }

  const categoryMap = new Map(categories.map((category) => [String(category._id), category]));
  return normalizedIds.map((id) => categoryMap.get(id)).filter(Boolean);
}

async function uploadProductImages(rawImages = []) {
  return Promise.all(
    (rawImages || []).map(async (image) => {
      if (image && typeof image === "object" && image.url) {
        return {
          url: image.url,
          alt: image.alt || "",
          publicId: image.publicId || ""
        };
      }

      return uploadBufferImage(image, "marketplace/products");
    })
  );
}

async function refreshProductReviewStats(productId) {
  if (!productId) return;

  const approvedReviews = await Review.find({ product: productId, status: "approved" }).select("rating").lean();
  const ratingCount = approvedReviews.length;
  const ratingAverage = ratingCount
    ? approvedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / ratingCount
    : 0;

  await Product.updateOne(
    { _id: productId },
    {
      ratingCount,
      ratingAverage: Number(ratingAverage.toFixed(2))
    }
  );
}

function normalizeCategoryPayload(payload) {
  const keywords = String(payload.metaKeywords || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    name: payload.name,
    slug: slugify(payload.slug || payload.name),
    parent: payload.parentId || null,
    description: payload.description || "",
    image: payload.image || "",
    seo: {
      metaTitle: payload.metaTitle || "",
      metaDescription: payload.metaDescription || "",
      keywords
    }
  };
}

function getProductCategoryIds(payload) {
  const categoryIds = Array.isArray(payload.categoryIds) ? payload.categoryIds.filter(Boolean) : [];
  if (categoryIds.length) return categoryIds;
  return payload.categoryId ? [payload.categoryId] : [];
}

function normalizeCategoryResponse(category, productCountMap = new Map()) {
  return {
    ...category,
    parentId: category?.parent?._id || category?.parent || null,
    productCount: productCountMap.get(String(category._id)) || 0,
    metaTitle: category?.seo?.metaTitle || "",
    metaDescription: category?.seo?.metaDescription || "",
    metaKeywords: Array.isArray(category?.seo?.keywords) ? category.seo.keywords.join(", ") : ""
  };
}

function normalizeVendorLabel(vendor) {
  if (!vendor) return null;
  return vendor.storeName || vendor.name || vendor.email || "Marketplace";
}

function normalizeProductPayload(payload) {
  return {
    name: payload.name,
    slug: slugify(payload.slug || payload.name),
    description: payload.description,
    shortDescription: payload.shortDescription,
    price: payload.price,
    compareAtPrice: payload.compareAtPrice,
    stock: payload.stock,
    weight: payload.weight ?? 0,
    sku: payload.sku,
    variants: payload.variants || [],
    variantCombinations: payload.variantCombinations || [],
    benefitsHeading: payload.benefitsHeading || "",
    benefitsText: payload.benefitsText || "",
    tags: payload.tags || [],
    seo: payload.seo
  };
}

function resolvePageType(pageLike = {}) {
  return pageLike?.type === "policy" ? "policy" : "page";
}

function normalizePageResponse(page) {
  return {
    ...page,
    type: resolvePageType(page)
  };
}

function assertAllowedDynamicPageSlug(rawSlug, rawTitle) {
  const slug = slugify(rawSlug || rawTitle);
  if (DESIGNED_SEO_PAGE_KEYS.includes(slug)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "This slug is reserved for a designed page and cannot be created in Dynamic Pages.");
  }
}

async function resolveAnnouncementTargetVendors(targetVendorIds = []) {
  const uniqueIds = [...new Set((targetVendorIds || []).filter(Boolean).map((value) => String(value)))];
  if (!uniqueIds.length) {
    return [];
  }

  const vendors = await User.find({ _id: { $in: uniqueIds }, role: "vendor" }).select("_id").lean();
  if (vendors.length !== uniqueIds.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "One or more selected vendors are invalid.");
  }

  return vendors.map((vendor) => vendor._id);
}

export const getDashboard = asyncHandler(async (_req, res) => {
  const [users, vendors, customers, products, orders, revenueAgg, adminProductsCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "vendor" }),
    User.countDocuments({ role: "customer" }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, revenue: { $sum: "$totalAmount" } } }]),
    Product.aggregate([
      { $lookup: { from: "users", localField: "vendor", foreignField: "_id", as: "vendorUser" } },
      { $unwind: "$vendorUser" },
      { $match: { "vendorUser.role": "admin" } },
      { $count: "count" }
    ])
  ]);

  res.json({
    success: true,
    data: {
      users,
      vendors,
      customers,
      products,
      orders,
      revenue: revenueAgg[0]?.revenue || 0,
      adminProducts: adminProductsCount[0]?.count || 0
    }
  });
});

export const getAnalytics = asyncHandler(async (_req, res) => {
  const [dailySales, topVendorsRaw, returns] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } }, { $sort: { _id: -1 } }, { $limit: 14 }]),
    Order.aggregate([{ $unwind: "$vendorBreakdown" }, { $group: { _id: "$vendorBreakdown.vendor", revenue: { $sum: "$vendorBreakdown.subtotal" } } }, { $sort: { revenue: -1 } }, { $limit: 5 }]),
    ReturnRequest.countDocuments()
  ]);

  const vendorIds = topVendorsRaw.map((entry) => entry._id).filter(Boolean);
  const vendorRecords = await User.find({ _id: { $in: vendorIds } }).select("name storeName email role").lean();
  const vendorMap = new Map(vendorRecords.map((vendor) => [String(vendor._id), vendor]));
  const topVendors = topVendorsRaw.map((entry) => ({ ...entry, vendor: vendorMap.get(String(entry._id)) || null }));

  res.json({ success: true, data: { dailySales, topVendors, returns } });
});

export const listVendors = asyncHandler(async (_req, res) => {
  const vendors = await User.find({ role: "vendor" }).sort("-createdAt").lean();
  res.json({ success: true, data: vendors });
});

export const listCustomers = asyncHandler(async (_req, res) => {
  const customers = await User.find({ role: "customer" }).sort("-createdAt").lean();
  res.json({ success: true, data: customers });
});

export const listAdminUsers = asyncHandler(async (_req, res) => {
  const admins = await User.find({ role: "admin" })
    .select("name email status customRole createdAt")
    .populate("customRole", "name description permissions isActive")
    .sort("name email")
    .lean();
  res.json({ success: true, data: admins });
});

export const createEmployee = asyncHandler(async (req, res) => {
  const email = String(req.validatedBody.email || "").trim().toLowerCase();
  const existing = await User.findOne({ email }).lean();
  if (existing) throw new ApiError(StatusCodes.CONFLICT, "Email already registered");

  let customRole = null;
  if (req.validatedBody.customRoleId) {
    customRole = await Role.findById(req.validatedBody.customRoleId).lean();
    if (!customRole) throw new ApiError(StatusCodes.NOT_FOUND, "Role not found");
  }

  const employee = await User.create({
    name: String(req.validatedBody.name || "").trim(),
    email,
    password: req.validatedBody.password,
    phone: req.validatedBody.phone || "",
    role: "admin",
    status: req.validatedBody.status || "active",
    customRole: customRole?._id || null
  });

  await employee.populate("customRole", "name description permissions isActive");

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      status: employee.status,
      customRole: employee.customRole,
      createdAt: employee.createdAt
    }
  });
});

export const listRoles = asyncHandler(async (_req, res) => {
  const roles = await Role.find().sort("name").lean();
  res.json({ success: true, data: roles });
});

export const createRole = asyncHandler(async (req, res) => {
  const role = await Role.create({
    name: String(req.validatedBody.name || "").trim(),
    description: req.validatedBody.description || "",
    permissions: [...new Set(req.validatedBody.permissions || [])].sort(),
    isActive: req.validatedBody.isActive !== false
  });

  res.status(StatusCodes.CREATED).json({ success: true, data: role });
});

export const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError(StatusCodes.NOT_FOUND, "Role not found");

  role.name = String(req.validatedBody.name || "").trim();
  role.description = req.validatedBody.description || "";
  role.permissions = [...new Set(req.validatedBody.permissions || [])].sort();
  role.isActive = req.validatedBody.isActive !== false;
  await role.save();

  res.json({ success: true, data: role });
});

export const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findByIdAndDelete(req.params.id);
  if (!role) throw new ApiError(StatusCodes.NOT_FOUND, "Role not found");

  await User.updateMany({ customRole: role._id }, { $set: { customRole: null } });
  res.json({ success: true, message: "Role deleted" });
});

export const assignAdminRole = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ _id: req.params.id, role: "admin" });
  if (!admin) throw new ApiError(StatusCodes.NOT_FOUND, "Admin user not found");

  if (req.validatedBody.customRoleId) {
    const role = await Role.findById(req.validatedBody.customRoleId).lean();
    if (!role) throw new ApiError(StatusCodes.NOT_FOUND, "Role not found");
    admin.customRole = role._id;
  } else {
    admin.customRole = null;
  }

  await admin.save();
  await admin.populate("customRole", "name description permissions isActive");

  res.json({
    success: true,
    data: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      status: admin.status,
      customRole: admin.customRole
    }
  });
});

export const updateVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: "vendor" });
  if (!vendor) throw new ApiError(StatusCodes.NOT_FOUND, "Vendor not found");
  vendor.status = req.body.status;
  if (req.body.status === "active") vendor.vendorApprovedAt = new Date();
  await vendor.save();
  res.json({ success: true, data: vendor });
});

export const listProducts = asyncHandler(async (_req, res) => {
  const products = await Product.find()
    .populate("vendor", "name storeName email role")
    .populate("category", "name slug")
    .sort("-createdAt")
    .lean();
  res.json({ success: true, data: products.map((product) => ({ ...product, vendorLabel: normalizeVendorLabel(product.vendor) })) });
});

export const createAdminProduct = asyncHandler(async (req, res) => {
  const payload = req.validatedBody;
  const categories = await resolveCategories(getProductCategoryIds(payload));
  const primaryCategory = categories[0];
  const images = await uploadProductImages(req.body.images || []);
  const product = await Product.create({
    ...normalizeProductPayload(payload),
    vendor: req.user._id,
    category: primaryCategory._id,
    categories: categories.map((category) => category._id),
    categorySlug: primaryCategory.slug,
    categorySlugs: categories.map((category) => category.slug),
    images,
    status: "approved"
  });
  await syncMediaLibraryImages(req.user._id, images);
  res.status(StatusCodes.CREATED).json({ success: true, data: product });
});

export const getAdminProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug")
    .populate("vendor", "name storeName email role")
    .lean();
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  res.json({ success: true, data: product });
});

export const updateAdminProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  const payload = req.validatedBody;
  const categories = await resolveCategories(getProductCategoryIds(payload));
  const primaryCategory = categories[0];

  Object.assign(product, normalizeProductPayload(payload));
  product.category = primaryCategory._id;
  product.categories = categories.map((category) => category._id);
  product.categorySlug = primaryCategory.slug;
  product.categorySlugs = categories.map((category) => category.slug);
  product.status = product.vendor.equals(req.user._id) ? "approved" : "pending";
  product.rejectionReason = "";
  if (req.body.images) {
    product.images = await uploadProductImages(req.body.images);
    await syncMediaLibraryImages(req.user._id, product.images);
  }

  await product.save();
  res.json({ success: true, data: product });
});

export const deleteAdminProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  res.json({ success: true, message: "Product deleted" });
});

export const listAdminInventory = asyncHandler(async (req, res) => {
  const inventory = await Product.find()
    .select("name slug sku stock status price soldCount updatedAt description shortDescription compareAtPrice tags category images variants variantCombinations benefitsHeading benefitsText seo rejectionReason")
    .populate("category", "name slug")
    .populate("vendor", "name storeName email role")
    .sort("name")
    .lean();
  res.json({
    success: true,
    data: inventory.map((product) => ({
      ...product,
      vendorLabel: normalizeVendorLabel(product.vendor),
      ownerType: product.vendor?.role === "vendor" ? "vendor" : "admin"
    }))
  });
});

export const listMedia = asyncHandler(async (_req, res) => {
  const products = await Product.find().select("name slug images vendor").populate("vendor", "name storeName email role").lean();
  const media = products.flatMap((product) =>
    (product.images || []).map((image, index) => ({
      id: `${product._id}-${index}`,
      productId: product._id,
      productName: product.name,
      slug: product.slug,
      vendor: product.vendor,
      vendorLabel: normalizeVendorLabel(product.vendor),
      ...image
    }))
  );
  res.json({ success: true, data: media });
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  product.status = req.body.status;
  product.rejectionReason = req.body.rejectionReason || "";
  await product.save();
  res.json({ success: true, data: product });
});

export const listOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().populate("user", "name email").populate("items.vendor", "name storeName email role").sort("-createdAt").lean();
  res.json({
    success: true,
    data: orders.map((order) => ({
      ...order,
      vendorNames: Array.from(new Set((order.items || []).map((item) => normalizeVendorLabel(item.vendor)).filter(Boolean))).join(", ")
    }))
  });
});

export const getAdminOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.vendor", "name storeName email role")
    .populate("coupon", "code")
    .lean();

  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");

  res.json({
    success: true,
    data: {
      ...order,
      vendorNames: Array.from(new Set((order.items || []).map((item) => normalizeVendorLabel(item.vendor)).filter(Boolean))).join(", ")
    }
  });
});

export const listReturns = asyncHandler(async (_req, res) => {
  const returns = await ReturnRequest.find()
    .populate("product", "name slug sku images")
    .populate("customer", "name email phone")
    .populate("vendor", "name storeName email role")
    .populate("order", "createdAt customerName customerEmail customerPhone")
    .sort("-createdAt")
    .lean();
  res.json({ success: true, data: returns.map((entry) => ({ ...entry, vendorLabel: normalizeVendorLabel(entry.vendor) })) });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  order.status = req.body.status;
  if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;
  await order.save();
  res.json({ success: true, data: order });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(normalizeCategoryPayload(req.validatedBody));
  res.status(StatusCodes.CREATED).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
  const payload = normalizeCategoryPayload(req.validatedBody);
  category.name = payload.name;
  category.slug = payload.slug;
  category.parent = payload.parent;
  category.description = payload.description;
  category.image = payload.image;
  category.seo = payload.seo;
  await category.save();
  res.json({ success: true, data: category });
});

export const listCategories = asyncHandler(async (_req, res) => {
  const [categories, productCounts] = await Promise.all([
    Category.find().populate("parent", "name slug").sort("name").lean(),
    Product.aggregate([
      { $match: { category: { $ne: null } } },
      { $group: { _id: "$category", productCount: { $sum: 1 } } }
    ])
  ]);

  const productCountMap = new Map(productCounts.map((entry) => [String(entry._id), entry.productCount]));
  res.json({ success: true, data: categories.map((category) => normalizeCategoryResponse(category, productCountMap)) });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).lean();
  if (!category) throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");

  const [childCount, linkedProducts] = await Promise.all([
    Category.countDocuments({ parent: category._id }),
    Product.countDocuments({ category: category._id })
  ]);

  if (childCount > 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Delete or move subcategories before deleting this category.");
  }

  if (linkedProducts > 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "This category is assigned to products and cannot be deleted yet.");
  }

  await Category.deleteOne({ _id: category._id });
  res.json({ success: true, message: "Category deleted" });
});

export const listReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.find()
    .populate({
      path: "product",
      select: "name slug vendor",
      populate: { path: "vendor", select: "name storeName storeSlug" }
    })
    .populate("user", "name email phone")
    .populate("reviewedBy", "name email")
    .sort("-createdAt")
    .lean();
  res.json({ success: true, data: reviews });
});

export const getReviewSettings = asyncHandler(async (_req, res) => {
  const settings = await ReviewSettings.findOne({ key: "default" }).lean();
  res.json({
    success: true,
    data: {
      requireReviewApproval: settings?.requireReviewApproval !== false
    }
  });
});

export const updateReviewSettings = asyncHandler(async (req, res) => {
  const settings = await ReviewSettings.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        requireReviewApproval: req.validatedBody.requireReviewApproval
      },
      $setOnInsert: { key: "default" }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  res.json({
    success: true,
    data: {
      requireReviewApproval: settings.requireReviewApproval !== false
    }
  });
});

export const updateReviewStatus = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");

  review.status = req.validatedBody.status;
  review.moderationNote = req.validatedBody.moderationNote || "";
  review.reviewedBy = req.user._id;
  review.reviewedAt = new Date();

  await review.save();
  await refreshProductReviewStats(review.product);

  const updated = await Review.findById(review._id)
    .populate({
      path: "product",
      select: "name slug vendor",
      populate: { path: "vendor", select: "name storeName storeSlug" }
    })
    .populate("user", "name email phone")
    .populate("reviewedBy", "name email")
    .lean();

  res.json({ success: true, data: updated });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  await refreshProductReviewStats(review.product);
  res.json({ success: true, message: "Review deleted" });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({ ...req.validatedBody, code: req.validatedBody.code.toUpperCase() });
  await coupon.populate("productId", "name title");
  res.status(StatusCodes.CREATED).json({ success: true, data: coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(StatusCodes.NOT_FOUND, "Coupon not found");
  Object.assign(coupon, { ...req.validatedBody, code: req.validatedBody.code.toUpperCase() });
  await coupon.save();
  await coupon.populate("productId", "name title");
  res.json({ success: true, data: coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(StatusCodes.NOT_FOUND, "Coupon not found");
  res.json({ success: true, message: "Coupon deleted" });
});

export const listCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find()
    .populate("productId", "name title")
    .sort("-createdAt")
    .lean();
  res.json({ success: true, data: coupons });
});

export const createPage = asyncHandler(async (req, res) => {
  assertAllowedDynamicPageSlug(req.validatedBody.slug, req.validatedBody.title);
  const page = await Page.create({
    type: req.validatedBody.type || "page",
    title: req.validatedBody.title,
    slug: slugify(req.validatedBody.slug || req.validatedBody.title),
    content: req.validatedBody.content,
    seo: req.validatedBody.seo,
    isPublished: req.validatedBody.isPublished ?? true
  });
  res.status(StatusCodes.CREATED).json({ success: true, data: normalizePageResponse(page.toObject()) });
});

export const listPages = asyncHandler(async (_req, res) => {
  const pages = await Page.find({ slug: { $nin: DESIGNED_SEO_PAGE_KEYS } }).sort("title").lean();
  res.json({ success: true, data: pages.map((page) => normalizePageResponse(page)) });
});

export const updatePage = asyncHandler(async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) throw new ApiError(StatusCodes.NOT_FOUND, "Page not found");
  assertAllowedDynamicPageSlug(req.validatedBody.slug, req.validatedBody.title);
  page.type = req.validatedBody.type || resolvePageType(page);
  page.title = req.validatedBody.title;
  page.slug = slugify(req.validatedBody.slug || req.validatedBody.title);
  page.content = req.validatedBody.content;
  page.seo = req.validatedBody.seo;
  page.isPublished = req.validatedBody.isPublished ?? page.isPublished;
  await page.save();
  res.json({ success: true, data: normalizePageResponse(page.toObject()) });
});

export const listSeoPages = asyncHandler(async (_req, res) => {
  await ensureDesignedSeoPages();
  const pages = await SeoPage.find().sort("title").lean();
  res.json({ success: true, data: pages });
});

export const listRedirects = asyncHandler(async (_req, res) => {
  const redirects = await Redirect.find().sort("sourcePath createdAt").lean();
  res.json({ success: true, data: redirects });
});

export const createRedirect = asyncHandler(async (req, res) => {
  const sourcePath = normalizeRedirectPath(req.validatedBody.sourcePath);
  const rawDestinationPath = String(req.validatedBody.destinationPath || "").trim();
  const destinationPath = isExternalRedirectTarget(rawDestinationPath)
    ? rawDestinationPath
    : normalizeRedirectPath(rawDestinationPath);

  if (sourcePath === destinationPath) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Source and destination cannot be the same.");
  }

  const existingRedirect = await Redirect.findOne({ sourcePath }).lean();
  if (existingRedirect) {
    throw new ApiError(StatusCodes.CONFLICT, "A redirect for this source path already exists.");
  }

  const redirect = await Redirect.create({
    sourcePath,
    destinationPath,
    statusCode: req.validatedBody.statusCode || 301,
    isActive: req.validatedBody.isActive !== false,
    notes: req.validatedBody.notes || ""
  });

  res.status(StatusCodes.CREATED).json({ success: true, data: redirect });
});

export const updateRedirect = asyncHandler(async (req, res) => {
  const redirect = await Redirect.findById(req.params.id);
  if (!redirect) throw new ApiError(StatusCodes.NOT_FOUND, "Redirect not found");

  const sourcePath = normalizeRedirectPath(req.validatedBody.sourcePath);
  const rawDestinationPath = String(req.validatedBody.destinationPath || "").trim();
  const destinationPath = isExternalRedirectTarget(rawDestinationPath)
    ? rawDestinationPath
    : normalizeRedirectPath(rawDestinationPath);

  if (sourcePath === destinationPath) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Source and destination cannot be the same.");
  }

  const existingRedirect = await Redirect.findOne({ sourcePath, _id: { $ne: redirect._id } }).lean();
  if (existingRedirect) {
    throw new ApiError(StatusCodes.CONFLICT, "A redirect for this source path already exists.");
  }

  redirect.sourcePath = sourcePath;
  redirect.destinationPath = destinationPath;
  redirect.statusCode = req.validatedBody.statusCode || 301;
  redirect.isActive = req.validatedBody.isActive !== false;
  redirect.notes = req.validatedBody.notes || "";
  await redirect.save();

  res.json({ success: true, data: redirect });
});

export const deleteRedirect = asyncHandler(async (req, res) => {
  const redirect = await Redirect.findByIdAndDelete(req.params.id);
  if (!redirect) throw new ApiError(StatusCodes.NOT_FOUND, "Redirect not found");
  res.json({ success: true, message: "Redirect deleted" });
});

export const updateSeoPage = asyncHandler(async (req, res) => {
  const seoPage = await SeoPage.findOne({ key: req.params.key });
  if (!seoPage) throw new ApiError(StatusCodes.NOT_FOUND, "SEO page not found");

  seoPage.metaTitle = req.validatedBody.metaTitle || "";
  seoPage.metaDescription = req.validatedBody.metaDescription || "";
  await seoPage.save();

  res.json({ success: true, data: seoPage.toObject() });
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const targetVendors = req.validatedBody.audience === "vendors"
    ? await resolveAnnouncementTargetVendors(req.validatedBody.targetVendorIds)
    : [];

  const announcement = await Announcement.create({
    title: req.validatedBody.title,
    message: req.validatedBody.message,
    audience: req.validatedBody.audience,
    targetVendors,
    isActive: req.validatedBody.isActive !== false,
    startsAt: req.validatedBody.startsAt || null,
    endsAt: req.validatedBody.endsAt || null,
    createdBy: req.user._id
  });

  await announcement.populate("targetVendors", "name storeName email");
  res.status(StatusCodes.CREATED).json({ success: true, data: announcement });
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new ApiError(StatusCodes.NOT_FOUND, "Announcement not found");

  const targetVendors = req.validatedBody.audience === "vendors"
    ? await resolveAnnouncementTargetVendors(req.validatedBody.targetVendorIds)
    : [];

  announcement.title = req.validatedBody.title;
  announcement.message = req.validatedBody.message;
  announcement.audience = req.validatedBody.audience;
  announcement.targetVendors = targetVendors;
  announcement.isActive = req.validatedBody.isActive !== false;
  announcement.startsAt = req.validatedBody.startsAt || null;
  announcement.endsAt = req.validatedBody.endsAt || null;
  await announcement.save();

  await announcement.populate("targetVendors", "name storeName email");
  res.json({ success: true, data: announcement });
});

export const listAnnouncements = asyncHandler(async (_req, res) => {
  const announcements = await Announcement.find()
    .populate("targetVendors", "name storeName email")
    .sort("-createdAt")
    .lean();
  res.json({ success: true, data: announcements });
});

export const createMenu = asyncHandler(async (req, res) => {
  const menu = await Menu.create(req.validatedBody);
  res.status(StatusCodes.CREATED).json({ success: true, data: menu });
});

export const getMenuSettings = asyncHandler(async (_req, res) => {
  const settings = await MenuSettings.findOne({ key: "default" }).lean();
  res.json({
    success: true,
    data: {
      browseMenu: settings?.browseMenu || [],
      topBarMenu: settings?.topBarMenu || [],
      mainNavMenu: settings?.mainNavMenu || [],
      footerMenu: settings?.footerMenu || [],
      policiesMenu: settings?.policiesMenu || []
    }
  });
});

export const updateMenuSettings = asyncHandler(async (req, res) => {
  const settings = await MenuSettings.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        browseMenu: req.validatedBody.browseMenu,
        topBarMenu: req.validatedBody.topBarMenu,
        mainNavMenu: req.validatedBody.mainNavMenu,
        footerMenu: req.validatedBody.footerMenu,
        policiesMenu: req.validatedBody.policiesMenu
      },
      $setOnInsert: { key: "default" }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  res.json({
    success: true,
    data: {
      browseMenu: settings?.browseMenu || [],
      topBarMenu: settings?.topBarMenu || [],
      mainNavMenu: settings?.mainNavMenu || [],
      footerMenu: settings?.footerMenu || [],
      policiesMenu: settings?.policiesMenu || []
    }
  });
});

export const listMenus = asyncHandler(async (_req, res) => {
  const menus = await Menu.find().sort("name").lean();
  res.json({ success: true, data: menus });
});

export const updateMenu = asyncHandler(async (req, res) => {
  const menu = await Menu.findById(req.params.id);
  if (!menu) throw new ApiError(StatusCodes.NOT_FOUND, "Menu not found");
  Object.assign(menu, req.validatedBody);
  await menu.save();
  res.json({ success: true, data: menu });
});

export const deleteMenu = asyncHandler(async (req, res) => {
  const menu = await Menu.findByIdAndDelete(req.params.id);
  if (!menu) throw new ApiError(StatusCodes.NOT_FOUND, "Menu not found");
  res.json({ success: true, message: "Menu deleted" });
});

export const listConversations = asyncHandler(async (_req, res) => {
  const conversations = await Conversation.find().sort("-updatedAt").lean();
  res.json({ success: true, data: conversations });
});

export const listMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ conversation: req.params.id }).sort("createdAt").lean();
  res.json({ success: true, data: messages });
});
