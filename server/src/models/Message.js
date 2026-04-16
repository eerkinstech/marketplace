import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    senderName: { type: String, required: true },
    senderRole: String,
    senderEmail: String,
    body: { type: String, required: true },
    attachments: [String]
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
