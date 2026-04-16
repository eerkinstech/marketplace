import { z } from "zod";

export const couponSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive(),
  minimumOrderAmount: z.number().nonnegative().optional(),
  expiry: z.string(),
  maxUses: z.number().int().positive().optional(),
  productId: z.string().min(1).optional(),
  isActive: z.boolean().optional()
});
