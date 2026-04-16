import { z } from "zod";

export const createReturnRequestSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(5),
  productId: z.string().min(1),
  orderDate: z.string().min(1),
  orderId: z.string().optional().or(z.literal("")),
  proof: z.string().optional().or(z.literal("")),
  reason: z.string().trim().min(10)
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(["requested", "approved", "rejected", "received", "refunded"]),
  statusNote: z.string().trim().max(500).optional()
});
