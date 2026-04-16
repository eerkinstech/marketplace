import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ["vendors", "customers", "all"],
      default: "all",
      index: true
    },
    targetVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    isActive: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Announcement = mongoose.model("Announcement", announcementSchema);
