import mongoose from "mongoose";

const redirectSchema = new mongoose.Schema(
  {
    sourcePath: { type: String, required: true, unique: true, index: true },
    destinationPath: { type: String, required: true },
    statusCode: { type: Number, enum: [301, 302], default: 301 },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String, default: "" },
    hitCount: { type: Number, default: 0 },
    lastMatchedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Redirect = mongoose.model("Redirect", redirectSchema);
