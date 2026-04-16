import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    permissions: [{ type: String, required: true }],
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const Role = mongoose.model("Role", roleSchema);
