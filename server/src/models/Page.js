import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["page", "policy"], default: "page", index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    seo: {
      metaTitle: String,
      metaDescription: String
    },
    isPublished: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Page = mongoose.model("Page", pageSchema);
