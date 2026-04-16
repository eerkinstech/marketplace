import mongoose from "mongoose";

const seoPageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    path: { type: String, required: true },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" }
  },
  { timestamps: true }
);

export const SeoPage = mongoose.model("SeoPage", seoPageSchema);
