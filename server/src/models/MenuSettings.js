import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    url: { type: String, required: true },
    link: { type: String, default: "" },
    type: { type: String, default: "custom" },
    submenu: []
  },
  { _id: false }
);

const menuSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    browseMenu: { type: [menuItemSchema], default: [] },
    topBarMenu: { type: [menuItemSchema], default: [] },
    mainNavMenu: { type: [menuItemSchema], default: [] },
    footerMenu: { type: [menuItemSchema], default: [] },
    policiesMenu: { type: [menuItemSchema], default: [] }
  },
  { timestamps: true }
);

export const MenuSettings = mongoose.model("MenuSettings", menuSettingsSchema);
