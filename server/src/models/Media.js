import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    publicId: { type: String, default: "" }
  },
  { timestamps: true }
);

mediaSchema.index({ owner: 1, createdAt: -1 });

export const Media = mongoose.model("Media", mediaSchema);
