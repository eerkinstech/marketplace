import { StatusCodes } from "http-status-codes";
import { Announcement } from "../../models/Announcement.js";
import { Category } from "../../models/Category.js";
import { Conversation } from "../../models/Conversation.js";
import { Coupon } from "../../models/Coupon.js";
import { Order } from "../../models/Order.js";
import { Product } from "../../models/Product.js";
import { ReturnRequest } from "../../models/ReturnRequest.js";
import { Review } from "../../models/Review.js";
import { ShippingArea } from "../../models/ShippingArea.js";
import { User } from "../../models/User.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { slugify } from "../../utils/slugify.js";
import { uploadBufferImage } from "../../services/storage/upload.service.js";
import { syncMediaLibraryImages } from "../../services/media/syncMediaLibrary.service.js";

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

async function resolveVendorShippingAreaIds(areaIds = [], owner) {
  const normalizedIds = [...new Set((areaIds || []).filter(Boolean).map(String))];
  if (!normalizedIds.length) return [];

  const areas = await ShippingArea.find({
    _id: { $in: normalizedIds },
    ownerType: "vendor",
    owner
  }).select("_id").lean();

  if (areas.length !== normalizedIds.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "One or more shipping options are invalid");
  }

  return normalizedIds;
}

function getProductCategoryIds(payload) {
  const categoryIds = Array.isArray(payload.categoryIds) ? payload.categoryIds.filter(Boolean) : [];
  if (categoryIds.length) return categoryIds;
  return payload.categoryId ? [payload.categoryId] : [];
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

async function normalizeProfileImage(value, folder) {
  if (!value) return "";
  if (typeof value !== "string") return "";
  if (value.startsWith("data:")) {
    const uploaded = await uploadBufferImage(value, folder);
    return uploaded.url;
  }
  return value;
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

export const getDashboard = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const productIds = await Product.find({ vendor: vendorId }).distinct("_id");

  const [productCount, orderCount, revenueAgg, reviewCount, recentOrders] = await Promise.all([
    Product.countDocuments({ vendor: vendorId }),
    Order.countDocuments({ "items.vendor": vendorId }),
    Order.aggregate([
      { $match: { "items.vendor": vendorId, paymentStatus: "paid" } },
      { $unwind: "$items" },
      { $match: { "items.vendor": vendorId } },
      { $group: { _id: null, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } }
    ]),
    Review.countDocuments({ product: { $in: productIds } }),
    Order.find({ "items.vendor": vendorId }).sort("-createdAt").limit(5).lean()
  ]);

  res.json({ success: true, data: { metrics: { productCount, orderCount, revenue: revenueAgg[0]?.revenue || 0, reviewCount }, recentOrders } });
});

export const getVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await User.findById(req.user._id)
    .select("name email phone storeName storeSlug storeLogo profileImage addresses")
    .lean();

  const defaultAddress = Array.isArray(vendor?.addresses)
    ? vendor.addresses.find((entry) => entry.isDefault) || vendor.addresses[0]
    : null;

  res.json({
    success: true,
    data: {
      ...vendor,
      addressLine: defaultAddress?.street || "",
      city: defaultAddress?.city || "",
      state: defaultAddress?.state || "",
      country: defaultAddress?.country || "",
      postalCode: defaultAddress?.postalCode || ""
    }
  });
});

export const updateVendorProfile = asyncHandler(async (req, res) => {
  const payload = req.validatedBody;
  const existing = await User.findOne({
    email: payload.email.toLowerCase(),
    _id: { $ne: req.user._id }
  }).lean();

  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  const vendor = await User.findById(req.user._id);
  if (!vendor) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Vendor not found");
  }

  vendor.name = payload.name;
  vendor.email = payload.email.toLowerCase();
  vendor.phone = payload.phone || "";
  vendor.storeName = payload.storeName;
  vendor.storeSlug = slugify(payload.storeName);
  vendor.storeLogo = await normalizeProfileImage(payload.storeLogo, "marketplace/vendors/store-logos");
  vendor.profileImage = await normalizeProfileImage(payload.profileImage, "marketplace/vendors/profile-images");
  if (payload.password) {
    vendor.password = payload.password;
  }

  const hasAddressValue = [payload.addressLine, payload.city, payload.state, payload.country, payload.postalCode]
    .some((value) => Boolean(value && String(value).trim()));

  vendor.addresses = hasAddressValue
    ? [
      {
        label: "Business address",
        fullName: payload.name,
        phone: payload.phone || "",
        street: payload.addressLine || "",
        city: payload.city || "",
        state: payload.state || "",
        country: payload.country || "",
        postalCode: payload.postalCode || "",
        isDefault: true
      }
    ]
    : [];

  await vendor.save();

  res.json({
    success: true,
    message: "Vendor profile updated",
    data: {
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      storeName: vendor.storeName,
      storeSlug: vendor.storeSlug,
      storeLogo: vendor.storeLogo,
      profileImage: vendor.profileImage,
      addressLine: vendor.addresses?.[0]?.street || "",
      city: vendor.addresses?.[0]?.city || "",
      state: vendor.addresses?.[0]?.state || "",
      country: vendor.addresses?.[0]?.country || "",
      postalCode: vendor.addresses?.[0]?.postalCode || ""
    }
  });
});

export const getVendorAnalytics = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const vendorOrders = await Order.find({ "items.vendor": vendorId }).lean();
  const customerIds = vendorOrders.map((order) => order.user).filter(Boolean);
  const customers = await User.find({ _id: { $in: customerIds } }).select("name email createdAt").lean();
  const revenue = vendorOrders.reduce((sum, order) => sum + order.items.filter((item) => String(item.vendor) === String(vendorId)).reduce((sub, item) => sub + (item.price * item.quantity), 0), 0);
  const shippingSummary = vendorOrders.reduce((acc, order) => {
    order.items.filter((item) => String(item.vendor) === String(vendorId)).forEach((item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
    });
    return acc;
  }, {});

  res.json({ success: true, data: { revenue, storeFee: revenue * 0.1, netEarnings: revenue * 0.9, shippingSummary, customers } });
});

export const createProduct = asyncHandler(async (req, res) => {
  if (req.user.status !== "active") throw new ApiError(StatusCodes.FORBIDDEN, "Vendor account is not approved");
  const payload = req.validatedBody;
  const categories = await resolveCategories(getProductCategoryIds(payload));
  const shippingAreas = await resolveVendorShippingAreaIds(payload.shippingAreaIds || [], req.user._id);
  const primaryCategory = categories[0];
  const images = await uploadProductImages(req.body.images || []);
  const product = await Product.create({
    ...normalizeProductPayload(payload),
    vendor: req.user._id,
    category: primaryCategory._id,
    categories: categories.map((category) => category._id),
    categorySlug: primaryCategory.slug,
    categorySlugs: categories.map((category) => category.slug),
    shippingAreas,
    images,
    status: "pending"
  });
  await syncMediaLibraryImages(req.user._id, images);
  res.status(StatusCodes.CREATED).json({ success: true, data: product });
});

export const getVendorProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id })
    .populate("category", "name slug")
    .lean();
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  res.json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id });
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  const payload = req.validatedBody;
  const categories = await resolveCategories(getProductCategoryIds(payload));
  const shippingAreas = Array.isArray(payload.shippingAreaIds)
    ? await resolveVendorShippingAreaIds(payload.shippingAreaIds, req.user._id)
    : null;
  const primaryCategory = categories[0];
  product.category = primaryCategory._id;
  product.categories = categories.map((category) => category._id);
  product.categorySlug = primaryCategory.slug;
  product.categorySlugs = categories.map((category) => category.slug);
  if (shippingAreas) {
    product.shippingAreas = shippingAreas;
  }
  Object.assign(product, {
    ...normalizeProductPayload(payload),
    status: "pending"
  });
  product.rejectionReason = "";
  if (req.body.images) {
    product.images = await uploadProductImages(req.body.images);
    await syncMediaLibraryImages(req.user._id, product.images);
  }
  await product.save();
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, vendor: req.user._id });
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  res.json({ success: true, message: "Product deleted" });
});

export const listVendorProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ vendor: req.user._id })
    .populate("category", "name slug")
    .sort("-createdAt")
    .lean();
  res.json({ success: true, data: products });
});

export const listVendorOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ "items.vendor": req.user._id }).sort("-createdAt").lean();
  const filtered = orders.map((order) => ({ ...order, items: order.items.filter((item) => String(item.vendor) === String(req.user._id)) }));
  res.json({ success: true, data: filtered });
});

export const getVendorOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, "items.vendor": req.user._id }).lean();
  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");

  res.json({
    success: true,
    data: {
      ...order,
      items: (order.items || []).filter((item) => String(item.vendor) === String(req.user._id))
    }
  });
});

export const updateVendorOrderItemStatus = asyncHandler(async (req, res) => {
  const { orderId, productId, status } = req.body;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
  const item = order.items.find((entry) => String(entry.product) === String(productId) && String(entry.vendor) === String(req.user._id));
  if (!item) throw new ApiError(StatusCodes.NOT_FOUND, "Order item not found");
  item.status = status;
  const itemStatuses = order.items.map((entry) => entry.status);
  if (itemStatuses.every((entry) => entry === "delivered")) order.status = "delivered";
  else if (itemStatuses.some((entry) => entry === "shipped")) order.status = "shipped";
  else if (itemStatuses.some((entry) => entry === "processing")) order.status = "processing";
  await order.save();
  res.json({ success: true, data: order });
});

export const listVendorInventory = asyncHandler(async (req, res) => {
  const inventory = await Product.find({ vendor: req.user._id })
    .select("name slug sku stock status price soldCount updatedAt description shortDescription compareAtPrice tags category images variants variantCombinations benefitsHeading benefitsText seo rejectionReason")
    .populate("category", "name slug")
    .sort("name")
    .lean();
  res.json({ success: true, data: inventory });
});

export const listVendorMedia = asyncHandler(async (req, res) => {
  const products = await Product.find({ vendor: req.user._id }).select("name images slug").lean();
  const media = products.flatMap((product) => (product.images || []).map((image, index) => ({ id: `${product._id}-${index}`, productId: product._id, productName: product.name, slug: product.slug, ...image })));
  res.json({ success: true, data: media });
});

export const listVendorCustomers = asyncHandler(async (req, res) => {
  const orders = await Order.find({ "items.vendor": req.user._id })
    .populate("user", "name email createdAt")
    .sort("-createdAt")
    .lean();

  const customers = new Map();

  orders.forEach((order) => {
    const customer = order.user;
    if (!customer?._id) return;

    const vendorItems = (order.items || []).filter(
      (item) => String(item.vendor) === String(req.user._id)
    );
    if (!vendorItems.length) return;

    const customerId = String(customer._id);
    const subtotal = vendorItems.reduce(
      (sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)),
      0
    );
    const unitsPurchased = vendorItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    if (!customers.has(customerId)) {
      customers.set(customerId, {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        createdAt: customer.createdAt,
        orderCount: 0,
        unitsPurchased: 0,
        totalSpent: 0,
        lastOrderAt: order.createdAt
      });
    }

    const current = customers.get(customerId);
    current.orderCount += 1;
    current.unitsPurchased += unitsPurchased;
    current.totalSpent += subtotal;
    if (!current.lastOrderAt || new Date(order.createdAt) > new Date(current.lastOrderAt)) {
      current.lastOrderAt = order.createdAt;
    }
  });

  res.json({
    success: true,
    data: Array.from(customers.values()).sort(
      (left, right) => new Date(right.lastOrderAt) - new Date(left.lastOrderAt)
    )
  });
});

export const listVendorReviews = asyncHandler(async (req, res) => {
  const productIds = await Product.find({ vendor: req.user._id }).distinct("_id");
  const reviews = await Review.find({ product: { $in: productIds } }).populate("product", "name slug").populate("user", "name email").sort("-createdAt").lean();
  res.json({ success: true, data: reviews });
});

export const updateVendorReviewStatus = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id).populate("product", "vendor");
  if (!review) throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  if (!review.product || String(review.product.vendor) !== String(req.user._id)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only manage reviews for your own products");
  }

  review.status = req.validatedBody.status;
  review.moderationNote = req.validatedBody.moderationNote || "";
  review.reviewedBy = req.user._id;
  review.reviewedAt = new Date();

  await review.save();
  await refreshProductReviewStats(review.product._id || review.product);

  const updated = await Review.findById(review._id)
    .populate("product", "name slug")
    .populate("user", "name email")
    .populate("reviewedBy", "name email")
    .lean();

  res.json({ success: true, data: updated });
});

export const deleteVendorReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id).populate("product", "vendor");
  if (!review) throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  if (!review.product || String(review.product.vendor) !== String(req.user._id)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only delete reviews for your own products");
  }

  const productId = review.product._id || review.product;
  await Review.deleteOne({ _id: review._id });
  await refreshProductReviewStats(productId);

  res.json({ success: true, message: "Review deleted" });
});

export const listVendorShipping = asyncHandler(async (req, res) => {
  const orders = await Order.find({ "items.vendor": req.user._id }).sort("-createdAt").lean();
  const shipping = orders.flatMap((order) => order.items.filter((item) => String(item.vendor) === String(req.user._id)).map((item) => ({ orderId: order._id, createdAt: order.createdAt, shippingAddress: order.shippingAddress, ...item })));
  res.json({ success: true, data: shipping });
});

export const listVendorReturns = asyncHandler(async (req, res) => {
  const returns = await ReturnRequest.find({ vendor: req.user._id })
    .populate("product", "name slug sku images")
    .populate("customer", "name email phone")
    .populate("vendor", "name storeName email role")
    .populate("order", "createdAt customerName customerEmail customerPhone")
    .sort("-createdAt")
    .lean();
  res.json({ success: true, data: returns });
});

export const listVendorAnnouncements = asyncHandler(async (req, res) => {
  const now = new Date();
  const announcements = await Announcement.find({
    isActive: true,
    $and: [
      {
        $or: [
          { startsAt: null },
          { startsAt: { $exists: false } },
          { startsAt: { $lte: now } }
        ]
      },
      {
        $or: [
          { endsAt: null },
          { endsAt: { $exists: false } },
          { endsAt: { $gte: now } }
        ]
      },
      {
        $or: [
          { audience: "all" },
          {
            audience: "vendors",
            $or: [
              { targetVendors: { $exists: false } },
              { targetVendors: { $size: 0 } },
              { targetVendors: req.user._id }
            ]
          }
        ]
      }
    ]
  })
    .populate("createdBy", "name email")
    .sort("-createdAt")
    .lean();

  res.json({ success: true, data: announcements });
});

export const listVendorConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id }).sort("-updatedAt").lean();
  res.json({ success: true, data: conversations });
});

export const listVendorCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ vendor_id: req.user._id })
    .populate("productId")
    .sort("-createdAt")
    .lean();
  res.json({ success: true, data: coupons });
});

export const createVendorCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({
    ...req.validatedBody,
    code: req.validatedBody.code.toUpperCase(),
    vendor_id: req.user._id
  });
  await coupon.populate("productId");
  res.status(StatusCodes.CREATED).json({ success: true, data: coupon });
});

export const updateVendorCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ _id: req.params.id, vendor_id: req.user._id });
  if (!coupon) throw new ApiError(StatusCodes.NOT_FOUND, "Coupon not found");
  Object.assign(coupon, { ...req.validatedBody, code: req.validatedBody.code.toUpperCase() });
  await coupon.save();
  await coupon.populate("productId");
  res.json({ success: true, data: coupon });
});

export const deleteVendorCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, vendor_id: req.user._id });
  if (!coupon) throw new ApiError(StatusCodes.NOT_FOUND, "Coupon not found");
  res.json({ success: true, message: "Coupon deleted" });
});

export const getVendorProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ vendor: req.user._id })
    .select("_id name title slug price compareAtPrice stock images")
    .sort("-createdAt")
    .lean();
  res.json({ success: true, data: products });
});
