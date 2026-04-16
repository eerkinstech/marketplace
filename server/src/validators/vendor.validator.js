import { z } from "zod";

export const vendorProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  storeName: z.string().trim().min(3).max(120),
  storeLogo: z.string().trim().optional().or(z.literal("")),
  profileImage: z.string().trim().optional().or(z.literal("")),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  addressLine: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().max(30).optional().or(z.literal(""))
});
