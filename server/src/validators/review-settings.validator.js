import { z } from "zod";

export const updateReviewSettingsSchema = z.object({
  requireReviewApproval: z.boolean()
});
