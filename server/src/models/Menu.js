import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    order: { type: Number, default: 0 }
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    location: {
      type: String,
      enum: ["header", "footer", "sidebar", "custom"],
      default: "header"
    },
    items: [menuItemSchema],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Menu = mongoose.model("Menu", menuSchema);
