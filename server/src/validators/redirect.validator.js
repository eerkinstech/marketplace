import { z } from "zod";

export const redirectSchema = z.object({
  sourcePath: z.string().min(1),
  destinationPath: z.string().min(1),
  statusCode: z.union([z.literal(301), z.literal(302)]).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional()
});
