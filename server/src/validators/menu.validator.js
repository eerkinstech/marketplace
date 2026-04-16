import { z } from "zod";

export const menuSchema = z.object({
  name: z.string().min(2),
  location: z.enum(["header", "footer", "sidebar", "custom"]),
  isActive: z.boolean().optional(),
  items: z.array(
    z.object({
      label: z.string().min(1),
      href: z.string().min(1),
      order: z.number().optional()
    })
  ).default([])
});
