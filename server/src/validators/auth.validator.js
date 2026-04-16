import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["vendor", "customer"]).default("customer"),
  storeName: z.string().min(3).optional(),
  phone: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const shippingAddressSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  street: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional()
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  shippingAddress: shippingAddressSchema.optional()
});
