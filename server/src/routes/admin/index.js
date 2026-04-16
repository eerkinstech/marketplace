import { Router } from "express";
import {
  createAdminProduct,
  createAnnouncement,
  createCategory,
  createCoupon,
  createEmployee,
  createRole,
  createRedirect,
  createMenu,
  createPage,
  deleteCoupon,
  deleteRole,
  deleteRedirect,
  deleteAdminProduct,
  deleteCategory,
  deleteMenu,
  getAnalytics,
  getAdminOrder,
  getAdminProduct,
  getDashboard,
  getMenuSettings,
  getReviewSettings,
  listAdminInventory,
  listAnnouncements,
  listCategories,
  listCoupons,
  listCustomers,
  listAdminUsers,
  listMenus,
  listOrders,
  listPages,
  listRoles,
  listSeoPages,
  listProducts,
  listRedirects,
  listReturns,
  listReviews,
  listVendors,
  updateAdminProduct,
  updateAnnouncement,
  updateCategory,
  updateCoupon,
  updateMenu,
  updateMenuSettings,
  updateOrderStatus,
  updateRole,
  updatePage,
  updateProductStatus,
  updateReviewSettings,
  updateVendorStatus,
  deleteReview,
  updateReviewStatus,
  assignAdminRole,
  updateRedirect,
  updateSeoPage
} from "../../controllers/admin/admin.controller.js";
import {
  bulkDeleteMediaItems,
  deleteMediaItem,
  listMediaLibrary,
  uploadMediaLibrary
} from "../../controllers/media.controller.js";
import { createMessage, listConversations, listMessages } from "../../controllers/catalog/chat.controller.js";
import {
  listContactSubmissions,
  listNewsletterCampaigns,
  listNewsletterSubscribers,
  sendLatestCategoriesNewsletter
} from "../../controllers/catalog/engagement.controller.js";
import {
  assignAdminShippingAreasToProduct,
  createAdminShippingArea,
  deleteAdminShippingArea,
  getAdminShipping,
  updateAdminShippingArea
} from "../../controllers/shipping.controller.js";
import { updateAdminReturnStatus } from "../../controllers/returns.controller.js";
import {
  createAdminHomeSection,
  deleteAdminHomeSection,
  listAdminHomeSections,
  updateAdminHomeSection
} from "../../controllers/home.controller.js";
import { authorize, protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { announcementSchema } from "../../validators/announcement.validator.js";
import { categorySchema } from "../../validators/category.validator.js";
import { couponSchema } from "../../validators/coupon.validator.js";
import { menuSchema } from "../../validators/menu.validator.js";
import { pageSchema } from "../../validators/page.validator.js";
import { productSchema } from "../../validators/product.validator.js";
import { redirectSchema } from "../../validators/redirect.validator.js";
import { assignRoleSchema, createEmployeeSchema, roleSchema } from "../../validators/role.validator.js";
import { updateReviewStatusSchema } from "../../validators/review.validator.js";
import { updateReviewSettingsSchema } from "../../validators/review-settings.validator.js";
import { updateMenuSettingsSchema } from "../../validators/menu-settings.validator.js";
import { updateReturnStatusSchema } from "../../validators/return.validator.js";
import { updateSeoPageSchema } from "../../validators/seo-page.validator.js";
import { homeSectionSchema } from "../../validators/home-section.validator.js";

const router = Router();
router.use(protect, authorize("admin"));
router.get("/dashboard", getDashboard);
router.get("/analytics", getAnalytics);
router.get("/vendors", listVendors);
router.get("/customers", listCustomers);
router.get("/admin-users", listAdminUsers);
router.post("/admin-users", validate(createEmployeeSchema), createEmployee);
router.patch("/vendors/:id/status", updateVendorStatus);
router.get("/roles", listRoles);
router.post("/roles", validate(roleSchema), createRole);
router.put("/roles/:id", validate(roleSchema), updateRole);
router.delete("/roles/:id", deleteRole);
router.patch("/admin-users/:id/role", validate(assignRoleSchema), assignAdminRole);
router.get("/products", listProducts);
router.get("/products/:id", getAdminProduct);
router.post("/products", validate(productSchema), createAdminProduct);
router.put("/products/:id", validate(productSchema), updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);
router.patch("/products/:id/status", updateProductStatus);
router.get("/inventory", listAdminInventory);
router.get("/media", listMediaLibrary);
router.post("/media", uploadMediaLibrary);
router.post("/media/bulk-delete", bulkDeleteMediaItems);
router.delete("/media/:id", deleteMediaItem);
router.get("/orders", listOrders);
router.get("/orders/:id", getAdminOrder);
router.get("/returns", listReturns);
router.patch("/returns/:id/status", validate(updateReturnStatusSchema), updateAdminReturnStatus);
router.patch("/orders/:id/status", updateOrderStatus);
router.get("/categories", listCategories);
router.post("/categories", validate(categorySchema), createCategory);
router.put("/categories/:id", validate(categorySchema), updateCategory);
router.delete("/categories/:id", deleteCategory);
router.get("/reviews", listReviews);
router.get("/reviews/settings", getReviewSettings);
router.patch("/reviews/settings", validate(updateReviewSettingsSchema), updateReviewSettings);
router.patch("/reviews/:id/status", validate(updateReviewStatusSchema), updateReviewStatus);
router.delete("/reviews/:id", deleteReview);
router.get("/coupons", listCoupons);
router.post("/coupons", validate(couponSchema), createCoupon);
router.put("/coupons/:id", validate(couponSchema), updateCoupon);
router.delete("/coupons/:id", deleteCoupon);
router.get("/pages", listPages);
router.post("/pages", validate(pageSchema), createPage);
router.put("/pages/:id", validate(pageSchema), updatePage);
router.get("/seo-pages", listSeoPages);
router.put("/seo-pages/:key", validate(updateSeoPageSchema), updateSeoPage);
router.get("/redirects", listRedirects);
router.post("/redirects", validate(redirectSchema), createRedirect);
router.put("/redirects/:id", validate(redirectSchema), updateRedirect);
router.delete("/redirects/:id", deleteRedirect);
router.get("/announcements", listAnnouncements);
router.post("/announcements", validate(announcementSchema), createAnnouncement);
router.put("/announcements/:id", validate(announcementSchema), updateAnnouncement);
router.get("/menus", listMenus);
router.post("/menus", validate(menuSchema), createMenu);
router.get("/menus/settings", getMenuSettings);
router.put("/menus/settings", validate(updateMenuSettingsSchema), updateMenuSettings);
router.put("/menus/:id", validate(menuSchema), updateMenu);
router.delete("/menus/:id", deleteMenu);
router.get("/conversations", listConversations);
router.get("/conversations/:id/messages", listMessages);
router.post("/conversations/:id/messages", createMessage);
router.get("/contact-submissions", listContactSubmissions);
router.get("/newsletter/subscribers", listNewsletterSubscribers);
router.get("/newsletter/campaigns", listNewsletterCampaigns);
router.post("/newsletter/send-latest-categories", sendLatestCategoriesNewsletter);
router.get("/shipping", getAdminShipping);
router.post("/shipping/areas", createAdminShippingArea);
router.put("/shipping/areas/:id", updateAdminShippingArea);
router.delete("/shipping/areas/:id", deleteAdminShippingArea);
router.patch("/shipping/products/:id", assignAdminShippingAreasToProduct);
router.get("/home-sections", listAdminHomeSections);
router.post("/home-sections", validate(homeSectionSchema), createAdminHomeSection);
router.put("/home-sections/:id", validate(homeSectionSchema), updateAdminHomeSection);
router.delete("/home-sections/:id", deleteAdminHomeSection);

export default router;
