import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    subject: { type: String, required: true },
    label: {
      type: String,
      enum: ["vendor", "customer", "contact_form"],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    contactName: String,
    contactEmail: String,
    contactSubmission: { type: mongoose.Schema.Types.ObjectId, ref: "ContactSubmission", default: null },
    lastMessageAt: Date,
    lastMessagePreview: String
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ label: 1, updatedAt: -1 });
conversationSchema.index({ vendor: 1, updatedAt: -1 });
conversationSchema.index({ customer: 1, updatedAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
