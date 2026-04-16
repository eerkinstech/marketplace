import mongoose from "mongoose";

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: String,
    status: {
      type: String,
      enum: ["subscribed", "unsubscribed"],
      default: "subscribed",
      index: true
    },
    source: {
      type: String,
      enum: ["storefront", "checkout", "manual"],
      default: "storefront"
    },
    lastSentAt: Date
  },
  { timestamps: true }
);

export const NewsletterSubscriber = mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
