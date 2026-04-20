import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import xml from "xml";
import { Category } from "../../models/Category.js";
import { MenuSettings } from "../../models/MenuSettings.js";
import { Page } from "../../models/Page.js";
import { Product } from "../../models/Product.js";
import { Redirect } from "../../models/Redirect.js";
import { SeoPage } from "../../models/SeoPage.js";
import { User } from "../../models/User.js";
import { Review } from "../../models/Review.js";
import { ReviewSettings } from "../../models/ReviewSettings.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { DESIGNED_SEO_PAGE_KEYS, ensureDesignedSeoPages } from "../../utils/designedSeoPages.js";
import { isExternalRedirectTarget, normalizeRedirectPath } from "../../utils/redirects.js";
import { buildProductQuery } from "../../utils/queryFeatures.js";
import { withCache } from "../../services/search/cache.service.js";

function resolvePageType(pageLike = {}) {
  return pageLike?.type === "policy" ? "policy" : "page";
}

function normalizePageResponse(page) {
  return {
    ...page,
    type: resolvePageType(page)
  };
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

export const listProducts = asyncHandler(async (req, res) => {
  const { filters, sort, page, limit } = buildProductQuery(req.query);
  const skip = (page - 1) * limit;

  const cacheKey = `products:${JSON.stringify({ filters, sort, page, limit })}`;
  const data = await withCache(cacheKey, 60, async () => {
    const [items, total] = await Promise.all([
      Product.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("vendor", "storeName storeSlug")
        .populate("category", "name slug")
        .lean(),
      Product.countDocuments(filters)
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  });

  res.json({ success: true, data });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: "approved" })
    .populate("vendor", "storeName storeSlug storeDescription storeLogo profileImage")
    .populate("category", "name slug")
    .lean();

  if (!product) {
    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Product not found" });
  }

  const reviews = await Review.find({ product: product._id, status: "approved" })
    .populate("user", "name")
    .sort("-createdAt")
    .lean();

  res.json({
    success: true,
    data: {
      ...product,
      reviews: reviews.map((review) => ({
        ...review,
        isApproved: review.status === "approved"
      }))
    }
  });
});

export const createPublicProductReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }

  const payload = req.validatedBody;
  const settings = await ReviewSettings.findOne({ key: "default" }).lean();
  const requireReviewApproval = settings?.requireReviewApproval !== false;
  const guestEmail = String(payload.email || "").trim().toLowerCase();
  const guestUserId = guestEmail
    ? new Review.db.base.Types.ObjectId(
      crypto.createHash("md5").update(guestEmail).digest("hex").slice(0, 24)
    )
    : null;

  let review;
  try {
    review = await Review.create({
      product: product._id,
      user: req.user?._id || guestUserId,
      guestName: payload.name || "",
      guestEmail,
      rating: payload.rating,
      comment: payload.comment,
      status: requireReviewApproval ? "pending" : "approved"
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, "You have already submitted a review for this product.");
    }
    throw error;
  }

  if (review.status === "approved") {
    await refreshProductReviewStats(product._id);
  }

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: requireReviewApproval ? "Review submitted and waiting for approval" : "Review submitted successfully",
    data: {
      ...review.toObject(),
      isApproved: review.status === "approved"
    }
  });
});

export const getPublicReviewSettings = asyncHandler(async (_req, res) => {
  const settings = await ReviewSettings.findOne({ key: "default" }).lean();
  res.json({
    success: true,
    data: {
      requireReviewApproval: settings?.requireReviewApproval !== false
    }
  });
});

export const getPublicMenuSettings = asyncHandler(async (_req, res) => {
  const settings = await MenuSettings.findOne({ key: "default" }).lean();
  res.json({
    success: true,
    data: {
      browseMenu: settings?.browseMenu || [],
      topBarMenu: settings?.topBarMenu || [],
      mainNavMenu: settings?.mainNavMenu || [],
      footerFirstMenu: settings?.footerFirstMenu || [],
      footerMenu: settings?.footerMenu || [],
      policiesMenu: settings?.policiesMenu || []
    }
  });
});

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort("name").lean();
  res.json({ success: true, data: categories });
});

export const listStores = asyncHandler(async (_req, res) => {
  const vendors = await User.find({ role: "vendor", status: "active" })
    .select("name storeName storeSlug storeDescription storeBanner storeLogo profileImage")
    .sort("storeName")
    .lean();

  const vendorIds = vendors.map((vendor) => vendor._id);
  const counts = await Product.aggregate([
    { $match: { status: "approved", vendor: { $in: vendorIds } } },
    { $group: { _id: "$vendor", productCount: { $sum: 1 }, totalSold: { $sum: "$soldCount" } } }
  ]);

  const countMap = new Map(counts.map((entry) => [String(entry._id), entry]));
  res.json({
    success: true,
    data: vendors.map((vendor) => ({
      ...vendor,
      productCount: countMap.get(String(vendor._id))?.productCount || 0,
      totalSold: countMap.get(String(vendor._id))?.totalSold || 0
    }))
  });
});

export const getStoreBySlug = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({
    storeSlug: req.params.slug,
    role: "vendor",
    status: "active"
  })
    .select("name storeName storeSlug storeDescription storeBanner storeLogo profileImage")
    .lean();

  if (!vendor) {
    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Store not found" });
  }

  const products = await Product.find({ vendor: vendor._id, status: "approved" })
    .sort("-createdAt")
    .lean();

  res.json({ success: true, data: { vendor, products } });
});

export const listPages = asyncHandler(async (_req, res) => {
  const pages = await Page.find({ isPublished: true, slug: { $nin: DESIGNED_SEO_PAGE_KEYS } }).sort("title").lean();
  res.json({
    success: true,
    data: pages
      .map((page) => normalizePageResponse(page))
      .filter((page) => page.type === "page")
  });
});

async function getPageBySlugForType(req, res, type) {
  const page = await Page.findOne({ slug: req.params.slug, isPublished: true }).lean();
  const normalizedPage = page ? normalizePageResponse(page) : null;

  if (!normalizedPage || normalizedPage.type !== type) {
    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Page not found" });
  }

  res.json({ success: true, data: normalizedPage });
}

export const getPageBySlug = asyncHandler(async (req, res) => {
  await getPageBySlugForType(req, res, "page");
});

export const getPolicyBySlug = asyncHandler(async (req, res) => {
  await getPageBySlugForType(req, res, "policy");
});

export const getSeoPageByKey = asyncHandler(async (req, res) => {
  await ensureDesignedSeoPages();
  const seoPage = await SeoPage.findOne({ key: req.params.key }).lean();
  if (!seoPage) {
    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "SEO page not found" });
  }

  res.json({ success: true, data: seoPage });
});

export const resolveRedirect = asyncHandler(async (req, res) => {
  const sourcePath = normalizeRedirectPath(req.query.path || "/");
  const redirect = await Redirect.findOne({ sourcePath, isActive: true }).lean();

  if (!redirect) {
    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Redirect not found" });
  }

  await Redirect.updateOne(
    { _id: redirect._id },
    {
      $inc: { hitCount: 1 },
      $set: { lastMatchedAt: new Date() }
    }
  );

  res.json({
    success: true,
    data: {
      sourcePath: redirect.sourcePath,
      destinationPath: redirect.destinationPath,
      statusCode: redirect.statusCode,
      isExternal: isExternalRedirectTarget(redirect.destinationPath)
    }
  });
});

export const productFeed = asyncHandler(async (_req, res) => {
  const products = await Product.find({ status: "approved" })
    .populate("category", "name")
    .populate("vendor", "storeName")
    .limit(1000)
    .lean();

  const feed = xml(
    [
      {
        rss: [
          { _attr: { version: "2.0", "xmlns:g": "http://base.google.com/ns/1.0" } },
          {
            channel: [
              { title: "Marketplace Product Feed" },
              { description: "SEO product feed for Merchant Center" },
              { link: "http://localhost:3000" },
              ...products.map((product) => ({
                item: [
                  { "g:id": String(product._id) },
                  { title: product.name },
                  { description: product.shortDescription || product.description },
                  { link: `http://localhost:3000/product/${product.slug}` },
                  { "g:price": `${product.price} USD` },
                  { "g:availability": product.stock > 0 ? "in stock" : "out of stock" },
                  { "g:brand": product.vendor?.storeName || "Marketplace" },
                  { "g:product_type": product.category?.name || "General" },
                  { "g:image_link": product.images?.[0]?.url || "" }
                ]
              }))
            ]
          }
        ]
      }
    ],
    { declaration: true }
  );

  res.set("Content-Type", "application/xml");
  res.send(feed);
});
