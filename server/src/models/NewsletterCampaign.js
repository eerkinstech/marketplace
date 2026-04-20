import mongoose from "mongoose";

const newsletterCampaignSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    campaignType: {
      type: String,
      enum: ["latest_categories", "custom_customer"],
      default: "latest_categories"
    },
    audience: {
      type: String,
      enum: ["subscribers", "customers"],
      default: "subscribers"
    },
    previewText: String,
    html: { type: String, required: true },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    sentCount: { type: Number, default: 0 },
    deliveryMode: {
      type: String,
      enum: ["simulated", "smtp"],
      default: "simulated"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const NewsletterCampaign = mongoose.model("NewsletterCampaign", newsletterCampaignSchema);
