import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string().min(1)).min(1),
  isActive: z.boolean().optional()
});

export const assignRoleSchema = z.object({
  customRoleId: z.string().nullable().optional()
});

export const createEmployeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  status: z.enum(["active", "pending", "suspended"]).optional(),
  customRoleId: z.string().nullable().optional()
});
