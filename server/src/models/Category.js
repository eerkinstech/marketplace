import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    description: String,
    image: String,
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
