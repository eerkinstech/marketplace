import { z } from "zod";

const productOptionSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).min(1)
});

const productVariantCombinationSchema = z.object({
  optionValues: z.record(z.string()),
  sku: z.string().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  weight: z.number().nonnegative().optional(),
  image: z.string().optional()
});

export const productSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3).optional(),
  description: z.string().min(20),
  shortDescription: z.string().max(180).optional(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional(),
  categoryId: z.string().min(1).optional(),
  categoryIds: z.array(z.string().min(1)).min(1).optional(),
  stock: z.number().int().nonnegative(),
  weight: z.number().nonnegative().optional(),
  sku: z.string().min(3),
  variants: z.array(productOptionSchema).optional(),
  variantCombinations: z.array(productVariantCombinationSchema).optional(),
  benefitsHeading: z.string().optional(),
  benefitsText: z.string().optional(),
  tags: z.array(z.string()).optional(),
  shippingAreaIds: z.array(z.string().min(1)).optional(),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      keywords: z.array(z.string()).optional()
    })
    .optional()
}).refine((payload) => {
  const categoryIds = Array.isArray(payload.categoryIds) ? payload.categoryIds.filter(Boolean) : [];
  return Boolean(payload.categoryId) || categoryIds.length > 0;
}, {
  message: "At least one category is required.",
  path: ["categoryIds"]
});
