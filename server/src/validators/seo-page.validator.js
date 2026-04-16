import { z } from "zod";

export const updateSeoPageSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional()
});
