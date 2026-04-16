import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/tokens.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function canAccessConversation(user, conversation) {
  if (!user || !conversation) return false;
  if (user.role === "admin") return true;
  if (conversation.label === "contact_form") {
    if (user.role !== "customer") return false;
    if (conversation.customer && String(conversation.customer) === String(user._id)) return true;
    return normalizeEmail(conversation.contactEmail) === normalizeEmail(user.email);
  }
  if (conversation.vendor && String(conversation.vendor) === String(user._id)) return true;
  if (conversation.customer && String(conversation.customer) === String(user._id)) return true;
  return (conversation.participants || []).some(
    (participant) => String(participant) === String(user._id)
  );
}

export const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = verifyAccessToken(token);
      socket.user = payload;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("conversation:join", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("message:send", async (payload) => {
      const conversation = await Conversation.findById(payload.conversationId);
      if (!conversation) return;

      const user = await User.findById(socket.user.sub).lean();
      if (!user) return;
      if (!canAccessConversation(user, conversation)) return;

      const message = await Message.create({
        conversation: payload.conversationId,
        sender: socket.user.sub,
        senderName: user.storeName || user.name || user.email || "Marketplace",
        senderRole: user.role,
        senderEmail: user.email,
        body: payload.body,
        attachments: payload.attachments || []
      });

      conversation.lastMessageAt = new Date();
      conversation.lastMessagePreview = message.body.slice(0, 140);
      await conversation.save();

      io.to(payload.conversationId).emit("message:new", message);
    });
  });

  return io;
};
