import { z } from "zod";

export const pageSchema = z.object({
  type: z.enum(["page", "policy"]).optional(),
  title: z.string().min(2),
  slug: z.string().min(2).optional(),
  content: z.string().min(10),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional()
  }).optional(),
  isPublished: z.boolean().optional()
});
