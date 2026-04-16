import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(3),
  message: z.string().min(10),
  audience: z.enum(["vendors", "customers", "all"]),
  targetVendorIds: z.array(z.string().min(1)).optional().default([]),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional()
});
