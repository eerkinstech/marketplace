import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: String,
    slug: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    weight: { type: Number, min: 0, default: 0 },
    image: String,
    variantSku: String,
    variantLabel: String,
    optionValues: {
      type: Map,
      of: String,
      default: {}
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending"
    }
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    customerName: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    items: [orderItemSchema],
    vendorBreakdown: [
      {
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        subtotal: Number
      }
    ],
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    paymentMethod: String,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    totalAmount: { type: Number, required: true },
    shippingAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

orderSchema.index({ "items.vendor": 1, createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
