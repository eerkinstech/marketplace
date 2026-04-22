import { Router } from "express";
import {
  quoteCatalogShipping,
} from "../../controllers/shipping.controller.js";
import { createReturnRequest } from "../../controllers/returns.controller.js";
import { listPublicHomeSections } from "../../controllers/home.controller.js";
import {
  getPageBySlug,
  getPolicyBySlug,
  getSeoPageByKey,
  getPublicMenuSettings,
  resolveRedirect,
  createPublicProductReview,
  getPublicReviewSettings,
  getProductBySlug,
  getStoreBySlug,
  listCategories,
  listPages,
  listProducts,
  listStores,
  productFeed,
  sitemapData
} from "../../controllers/catalog/catalog.controller.js";
import { createOrder, quoteCoupon } from "../../controllers/customer/customer.controller.js";
import { submitContactForm, subscribeNewsletter } from "../../controllers/catalog/engagement.controller.js";
import { optionalProtect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { couponQuoteSchema, createOrderSchema, shippingQuoteSchema } from "../../validators/order.validator.js";
import { createReturnRequestSchema } from "../../validators/return.validator.js";
import { publicReviewSchema } from "../../validators/review.validator.js";

const router = Router();

router.get("/home-sections", listPublicHomeSections);
router.get("/products", listProducts);
router.get("/reviews/settings", getPublicReviewSettings);
router.post("/products/:id/reviews", optionalProtect, validate(publicReviewSchema), createPublicProductReview);
router.get("/products/:slug", getProductBySlug);
router.get("/categories", listCategories);
router.get("/redirects/resolve", resolveRedirect);
router.get("/menus", getPublicMenuSettings);
router.get("/stores", listStores);
router.get("/stores/:slug", getStoreBySlug);
router.get("/pages", listPages);
router.get("/pages/:slug", getPageBySlug);
router.get("/policies/:slug", getPolicyBySlug);
router.get("/seo-pages/:key", getSeoPageByKey);
router.get("/sitemap", sitemapData);
router.get("/feed/products.xml", productFeed);
router.post("/newsletter/subscribe", subscribeNewsletter);
router.post("/contact", optionalProtect, submitContactForm);
router.post("/shipping/quote", optionalProtect, validate(shippingQuoteSchema), quoteCatalogShipping);
router.post("/coupons/quote", optionalProtect, validate(couponQuoteSchema), quoteCoupon);
router.post("/checkout", optionalProtect, validate(createOrderSchema), createOrder);
router.post("/returns", optionalProtect, validate(createReturnRequestSchema), createReturnRequest);

export default router;
