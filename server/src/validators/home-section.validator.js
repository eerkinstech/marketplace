import { z } from "zod";

const homeSectionItemSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  label: z.string().optional(),
  href: z.string().optional(),
  imageUrl: z.string().optional(),
  mobileImageUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  badge: z.string().optional()
});

export const homeSectionSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(1).optional(),
  sectionType: z.enum([
    "hero_slider",
    "category_strip",
    "category_grid",
    "product_carousel",
    "product_grid",
    "banner",
    "split_banner",
    "article_grid",
    "promo_showcase",
    "category_mosaic",
    "three_col_category",
    "image_banner"
  ]),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  theme: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  imageUrl: z.string().optional(),
  mobileImageUrl: z.string().optional(),
  limit: z.number().int().min(1).max(24).optional(),
  sourceMode: z.enum(["all", "manual", "category", "vendor"]).optional(),
  categoryIds: z.array(z.string()).optional(),
  vendorIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  items: z.array(homeSectionItemSchema).optional()
});
