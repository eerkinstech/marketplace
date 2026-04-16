import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10)
});

export const publicReviewSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10)
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  moderationNote: z.string().max(500).optional()
});
