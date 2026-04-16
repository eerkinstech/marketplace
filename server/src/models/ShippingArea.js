import mongoose from "mongoose";

const shippingRuleSchema = new mongoose.Schema(
  {
    minWeight: { type: Number, min: 0 },
    maxWeight: { type: Number, min: 0 },
    minPrice: { type: Number, min: 0 },
    maxPrice: { type: Number, min: 0 },
    rate: { type: Number, required: true, min: 0, default: 0 },
    isFreeShipping: { type: Boolean, default: false }
  },
  { _id: false }
);

const shippingAreaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rules: {
      type: [shippingRuleSchema],
      default: []
    },
    minRate: { type: Number, min: 0, default: 0 },
    maxRate: { type: Number, min: 0, default: 0 },
    estimatedDays: { type: String, trim: true, default: "" },
    ownerType: {
      type: String,
      enum: ["admin", "vendor"],
      required: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

shippingAreaSchema.index({ ownerType: 1, owner: 1, name: 1 });

export const ShippingArea = mongoose.model("ShippingArea", shippingAreaSchema);
