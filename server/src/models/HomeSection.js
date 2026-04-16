import mongoose from "mongoose";

const homeSectionItemSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, default: "" },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    description: { type: String, default: "" },
    label: { type: String, default: "" },
    href: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    mobileImageUrl: { type: String, default: "" },
    backgroundColor: { type: String, default: "" },
    textColor: { type: String, default: "" },
    accentColor: { type: String, default: "" },
    badge: { type: String, default: "" }
  },
  { _id: false }
);

const homeSectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    sectionType: {
      type: String,
      enum: [
        "hero_slider",
        "category_strip",
        "category_grid",
        "product_carousel",
        "product_grid",
        "banner",
        "split_banner",
        "article_grid"
      ],
      required: true
    },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    eyebrow: { type: String, default: "" },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    description: { type: String, default: "" },
    ctaLabel: { type: String, default: "" },
    ctaHref: { type: String, default: "" },
    theme: { type: String, default: "dark" },
    backgroundColor: { type: String, default: "" },
    textColor: { type: String, default: "" },
    accentColor: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    mobileImageUrl: { type: String, default: "" },
    limit: { type: Number, default: 6, min: 1, max: 24 },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    items: [homeSectionItemSchema]
  },
  { timestamps: true }
);

homeSectionSchema.index({ isActive: 1, order: 1, createdAt: 1 });

export const HomeSection = mongoose.model("HomeSection", homeSectionSchema);
