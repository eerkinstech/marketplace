import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    orderDate: { type: Date, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, required: true, trim: true },
    proofUrl: { type: String, default: "" },
    proofPublicId: { type: String, default: "" },
    reason: { type: String, required: true },
    statusNote: { type: String, default: "" },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "received", "refunded"],
      default: "requested"
    }
  },
  { timestamps: true }
);

export const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
