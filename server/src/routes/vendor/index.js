import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getDashboard,
  getVendorOrder,
  getVendorProfile,
  getVendorProduct,
  getVendorAnalytics,
  getVendorProducts,
  listVendorAnnouncements,
  listVendorCustomers,
  listVendorInventory,
  listVendorOrders,
  listVendorProducts,
  listVendorReturns,
  deleteVendorReview,
  listVendorReviews,
  listVendorShipping,
  updateVendorReviewStatus,
  updateProduct,
  updateVendorProfile,
  updateVendorOrderItemStatus,
  createVendorCoupon,
  listVendorCoupons,
  updateVendorCoupon,
  deleteVendorCoupon
} from "../../controllers/vendor/vendor.controller.js";
import {
  bulkDeleteMediaItems,
  deleteMediaItem,
  listMediaLibrary,
  uploadMediaLibrary
} from "../../controllers/media.controller.js";
import {
  createConversation,
  createMessage,
  listConversations,
  listMessages
} from "../../controllers/catalog/chat.controller.js";
import {
  assignVendorShippingAreasToProduct,
  createVendorShippingArea,
  deleteVendorShippingArea,
  getVendorShippingManagement,
  updateVendorShippingArea
} from "../../controllers/shipping.controller.js";
import { updateVendorReturnStatus } from "../../controllers/returns.controller.js";
import { authorize, protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { productSchema } from "../../validators/product.validator.js";
import { updateReviewStatusSchema } from "../../validators/review.validator.js";
import { updateReturnStatusSchema } from "../../validators/return.validator.js";
import { vendorProfileSchema } from "../../validators/vendor.validator.js";
import { couponSchema } from "../../validators/coupon.validator.js";

const router = Router();
router.use(protect, authorize("vendor"));
router.get("/dashboard", getDashboard);
router.get("/profile", getVendorProfile);
router.put("/profile", validate(vendorProfileSchema), updateVendorProfile);
router.get("/analytics", getVendorAnalytics);
router.get("/products", listVendorProducts);
router.get("/products/list", getVendorProducts);
router.get("/products/:id", getVendorProduct);
router.post("/products", validate(productSchema), createProduct);
router.put("/products/:id", validate(productSchema), updateProduct);
router.delete("/products/:id", deleteProduct);
router.get("/orders", listVendorOrders);
router.get("/orders/:id", getVendorOrder);
router.patch("/orders/status", updateVendorOrderItemStatus);
router.get("/inventory", listVendorInventory);
router.get("/media", listMediaLibrary);
router.post("/media", uploadMediaLibrary);
router.post("/media/bulk-delete", bulkDeleteMediaItems);
router.delete("/media/:id", deleteMediaItem);
router.get("/announcements", listVendorAnnouncements);
router.get("/customers", listVendorCustomers);
router.get("/conversations", listConversations);
router.post("/conversations", createConversation);
router.get("/conversations/:id/messages", listMessages);
router.post("/conversations/:id/messages", createMessage);
router.get("/reviews", listVendorReviews);
router.patch("/reviews/:id/status", validate(updateReviewStatusSchema), updateVendorReviewStatus);
router.delete("/reviews/:id", deleteVendorReview);
router.get("/shipping", listVendorShipping);
router.get("/shipping/manage", getVendorShippingManagement);
router.post("/shipping/areas", createVendorShippingArea);
router.put("/shipping/areas/:id", updateVendorShippingArea);
router.delete("/shipping/areas/:id", deleteVendorShippingArea);
router.patch("/shipping/products/:id", assignVendorShippingAreasToProduct);
router.get("/returns", listVendorReturns);
router.patch("/returns/:id/status", validate(updateReturnStatusSchema), updateVendorReturnStatus);
router.get("/coupons", listVendorCoupons);
router.post("/coupons", validate(couponSchema), createVendorCoupon);
router.put("/coupons/:id", validate(couponSchema), updateVendorCoupon);
router.delete("/coupons/:id", deleteVendorCoupon);

export default router;
