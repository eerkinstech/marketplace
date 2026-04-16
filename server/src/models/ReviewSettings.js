import mongoose from "mongoose";

const reviewSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    requireReviewApproval: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const ReviewSettings = mongoose.model("ReviewSettings", reviewSettingsSchema);
