import { z } from "zod";

export const checkoutItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      variantSku: z.string().optional(),
      optionValues: z.record(z.string()).optional()
    })
  )
  .min(1);

export const createOrderSchema = z.object({
  items: checkoutItemsSchema,
  customerEmail: z.string().email().optional(),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(6),
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    country: z.string().min(2),
    postalCode: z.string().min(3)
  }),
  billingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(6),
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    country: z.string().min(2),
    postalCode: z.string().min(3)
  }),
  couponCode: z.string().optional(),
  paymentMethod: z.string().min(2)
});

export const shippingQuoteSchema = z.object({
  items: checkoutItemsSchema
});

export const couponQuoteSchema = z.object({
  items: checkoutItemsSchema,
  couponCode: z.string().min(1)
});
