import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["admin", "vendor", "customer"],
      default: "customer",
      index: true
    },
    phone: String,
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
      index: true
    },
    storeName: String,
    storeSlug: { type: String, sparse: true, unique: true, index: true },
    storeDescription: String,
    storeBanner: String,
    storeLogo: String,
    profileImage: String,
    customRole: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null, index: true },
    vendorApprovedAt: Date,
    refreshTokenHash: { type: String, select: false },
    tokenVersion: { type: Number, default: 0 },
    addresses: [
      {
        label: String,
        fullName: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
        isDefault: { type: Boolean, default: false }
      }
    ]
  },
  { timestamps: true }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
