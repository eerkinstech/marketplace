import mongoose from "mongoose";

const productImageSchema = new mongoose.Schema(
  {
    url: String,
    alt: String,
    publicId: String
  },
  { _id: false }
);

const seoSchema = new mongoose.Schema(
  {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  { _id: false }
);

const productOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    values: [{ type: String, trim: true }]
  },
  { _id: false }
);

const productVariantCombinationSchema = new mongoose.Schema(
  {
    optionValues: {
      type: Map,
      of: String,
      default: {}
    },
    sku: { type: String, trim: true, default: "" },
    price: { type: Number, min: 0, default: 0 },
    stock: { type: Number, min: 0, default: 0 },
    weight: { type: Number, min: 0, default: 0 },
    image: { type: String, default: "" }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: "text" },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    shortDescription: String,
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: Number,
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    categorySlug: { type: String, required: true, index: true },
    images: [productImageSchema],
    stock: { type: Number, required: true, min: 0 },
    weight: { type: Number, min: 0, default: 0 },
    sku: { type: String, required: true, unique: true },
    variants: [productOptionSchema],
    variantCombinations: [productVariantCombinationSchema],
    benefitsHeading: String,
    benefitsText: String,
    tags: [String],
    shippingAreas: [{ type: mongoose.Schema.Types.ObjectId, ref: "ShippingArea" }],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    rejectionReason: String,
    seo: seoSchema,
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

productSchema.index({ vendor: 1, status: 1, createdAt: -1 });
productSchema.index({ category: 1, status: 1 });

export const Product = mongoose.model("Product", productSchema);
