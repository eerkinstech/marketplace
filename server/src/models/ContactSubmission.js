import mongoose from "mongoose";

const contactSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, index: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    vendorSlug: String,
    status: {
      type: String,
      enum: ["new", "reviewed", "closed"],
      default: "new",
      index: true
    }
  },
  { timestamps: true }
);

export const ContactSubmission = mongoose.model("ContactSubmission", contactSubmissionSchema);
