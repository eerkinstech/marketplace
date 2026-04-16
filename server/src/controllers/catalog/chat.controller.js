import { StatusCodes } from "http-status-codes";
import { Conversation } from "../../models/Conversation.js";
import { Message } from "../../models/Message.js";
import { User } from "../../models/User.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";

const conversationPopulate = [
  { path: "participants", select: "name email role storeName storeSlug" },
  { path: "vendor", select: "name email role storeName storeSlug" },
  { path: "customer", select: "name email role storeName storeSlug" }
];

function buildSenderMeta(user) {
  return {
    sender: user?._id || null,
    senderName: user?.storeName || user?.name || user?.email || "Marketplace",
    senderRole: user?.role || "guest",
    senderEmail: user?.email || ""
  };
}

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function canAccessConversation(user, conversation) {
  if (user.role === "admin") return true;
  if (conversation.label === "contact_form") {
    if (user.role !== "customer") return false;
    if (conversation.customer && String(conversation.customer) === String(user._id)) return true;
    return normalizeEmail(conversation.contactEmail) === normalizeEmail(user.email);
  }
  if (conversation.vendor && String(conversation.vendor) === String(user._id)) return true;
  if (conversation.customer && String(conversation.customer) === String(user._id)) return true;
  return (conversation.participants || []).some((participant) => String(participant) === String(user._id));
}

async function hydrateConversationQuery(query) {
  return Conversation.find(query).populate(conversationPopulate).sort("-lastMessageAt").lean();
}

export const listConversations = asyncHandler(async (req, res) => {
  const label = req.query.label || "";
  const filters = {};

  if (label) filters.label = label;

  if (req.user.role === "admin") {
    const conversations = await hydrateConversationQuery(filters);
    return res.json({ success: true, data: conversations });
  }

  if (req.user.role === "vendor") {
    filters.$or = [{ vendor: req.user._id }, { participants: req.user._id }];
    filters.label = label || { $in: ["vendor", "customer"] };
    const conversations = await hydrateConversationQuery(filters);
    return res.json({ success: true, data: conversations });
  }

  if (label === "contact_form") {
    filters.label = "contact_form";
    filters.$or = [{ customer: req.user._id }, { contactEmail: normalizeEmail(req.user.email) }];
  } else if (label) {
    filters.customer = req.user._id;
    filters.label = label;
  } else {
    filters.$or = [
      { customer: req.user._id, label: "customer" },
      { customer: req.user._id, label: "contact_form" },
      { label: "contact_form", contactEmail: normalizeEmail(req.user.email) }
    ];
  }

  const conversations = await hydrateConversationQuery(filters);
  res.json({ success: true, data: conversations });
});

export const createConversation = asyncHandler(async (req, res) => {
  const { subject, participants = [], targetRole } = req.body;
  if (!subject?.trim()) throw new ApiError(StatusCodes.BAD_REQUEST, "Subject is required");

  if (req.user.role === "customer") {
    const vendorId = participants[0];
    const vendor = await User.findOne({ _id: vendorId, role: "vendor", status: "active" });
    if (!vendor) throw new ApiError(StatusCodes.BAD_REQUEST, "Vendor not found");

    const existing = await Conversation.findOne({
      label: "customer",
      vendor: vendor._id,
      customer: req.user._id,
      status: "open"
    }).populate(conversationPopulate);

    if (existing) return res.json({ success: true, data: existing });

    const conversation = await Conversation.create({
      participants: [req.user._id, vendor._id],
      subject: subject.trim(),
      label: "customer",
      createdBy: req.user._id,
      vendor: vendor._id,
      customer: req.user._id,
      lastMessageAt: new Date()
    });

    const populated = await Conversation.findById(conversation._id).populate(conversationPopulate).lean();
    return res.status(StatusCodes.CREATED).json({ success: true, data: populated });
  }

  if (req.user.role === "vendor") {
    if (targetRole === "customer") {
      const customerId = participants[0];
      const customer = await User.findOne({ _id: customerId, role: "customer" });
      if (!customer) throw new ApiError(StatusCodes.BAD_REQUEST, "Customer not found");

      const existing = await Conversation.findOne({
        label: "customer",
        vendor: req.user._id,
        customer: customer._id,
        status: "open"
      }).populate(conversationPopulate);

      if (existing) return res.json({ success: true, data: existing });

      const conversation = await Conversation.create({
        participants: [req.user._id, customer._id],
        subject: subject.trim(),
        label: "customer",
        createdBy: req.user._id,
        vendor: req.user._id,
        customer: customer._id,
        lastMessageAt: new Date()
      });

      const populated = await Conversation.findById(conversation._id).populate(conversationPopulate).lean();
      return res.status(StatusCodes.CREATED).json({ success: true, data: populated });
    }

    const admin = await User.findOne({ role: "admin", status: "active" });
    if (!admin) throw new ApiError(StatusCodes.BAD_REQUEST, "Admin account not found");

    const conversation = await Conversation.create({
      participants: [req.user._id, admin._id],
      subject: subject.trim(),
      label: "vendor",
      createdBy: req.user._id,
      vendor: req.user._id,
      lastMessageAt: new Date()
    });

    const populated = await Conversation.findById(conversation._id).populate(conversationPopulate).lean();
    return res.status(StatusCodes.CREATED).json({ success: true, data: populated });
  }

  throw new ApiError(StatusCodes.FORBIDDEN, "Cannot create this conversation");
});

export const listMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw new ApiError(StatusCodes.NOT_FOUND, "Conversation not found");
  if (!canAccessConversation(req.user, conversation)) throw new ApiError(StatusCodes.FORBIDDEN, "Access denied");

  const messages = await Message.find({ conversation: req.params.id }).sort("createdAt").lean();
  res.json({ success: true, data: messages });
});

export const createMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw new ApiError(StatusCodes.NOT_FOUND, "Conversation not found");
  if (!canAccessConversation(req.user, conversation)) throw new ApiError(StatusCodes.FORBIDDEN, "Access denied");
  if (conversation.status === "closed") throw new ApiError(StatusCodes.BAD_REQUEST, "Conversation is closed");
  if (!req.body.body?.trim()) throw new ApiError(StatusCodes.BAD_REQUEST, "Message body is required");

  const message = await Message.create({
    conversation: conversation._id,
    ...buildSenderMeta(req.user),
    body: req.body.body.trim(),
    attachments: req.body.attachments || []
  });

  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessagePreview = message.body.slice(0, 140);
  await conversation.save();

  res.status(StatusCodes.CREATED).json({ success: true, data: message });
});
