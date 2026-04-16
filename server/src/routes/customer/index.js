import { Router } from "express";
import {
  createOrder,
  getMyOrder,
  createReview,
  listMyOrders,
  listMyReturns
} from "../../controllers/customer/customer.controller.js";
import { authorize, protect } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createOrderSchema } from "../../validators/order.validator.js";
import { reviewSchema } from "../../validators/review.validator.js";
import {
  createConversation,
  createMessage,
  listConversations,
  listMessages
} from "../../controllers/catalog/chat.controller.js";

const router = Router();

router.use(protect, authorize("customer", "vendor", "admin"));
router.post("/orders", validate(createOrderSchema), createOrder);
router.get("/orders", listMyOrders);
router.get("/orders/:id", getMyOrder);
router.get("/returns", listMyReturns);
router.post("/reviews", validate(reviewSchema), createReview);
router.get("/conversations", listConversations);
router.post("/conversations", createConversation);
router.get("/conversations/:id/messages", listMessages);
router.post("/conversations/:id/messages", createMessage);

export default router;
