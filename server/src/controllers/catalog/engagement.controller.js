import { StatusCodes } from "http-status-codes";
import { Category } from "../../models/Category.js";
import { ContactSubmission } from "../../models/ContactSubmission.js";
import { Conversation } from "../../models/Conversation.js";
import { Message } from "../../models/Message.js";
import { NewsletterCampaign } from "../../models/NewsletterCampaign.js";
import { NewsletterSubscriber } from "../../models/NewsletterSubscriber.js";
import { User } from "../../models/User.js";
import { sendEmail } from "../../services/notifications/email.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) throw new ApiError(StatusCodes.BAD_REQUEST, "Email is required");

  const subscriber = await NewsletterSubscriber.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        name: req.body.name?.trim() || "",
        status: "subscribed",
        source: req.body.source || "storefront"
      }
    },
    { new: true, upsert: true }
  );

  res.status(StatusCodes.CREATED).json({ success: true, data: subscriber, message: "Newsletter signup completed" });
});

export const submitContactForm = asyncHandler(async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const vendor = req.body.vendorSlug
    ? await User.findOne({ storeSlug: req.body.vendorSlug, role: "vendor", status: "active" })
    : null;
  const customer = req.user?.role === "customer"
    ? req.user
    : await User.findOne({ email, role: "customer", status: "active" });

  const submission = await ContactSubmission.create({
    name: req.body.name.trim(),
    email,
    subject: req.body.subject.trim(),
    message: req.body.message.trim(),
    vendor: vendor?._id || null,
    vendorSlug: req.body.vendorSlug || ""
  });

  const conversation = await Conversation.create({
    subject: submission.subject,
    label: "contact_form",
    contactName: submission.name,
    contactEmail: submission.email,
    contactSubmission: submission._id,
    vendor: vendor?._id || null,
    customer: customer?._id || null,
    status: "open",
    lastMessageAt: new Date(),
    lastMessagePreview: submission.message.slice(0, 140)
  });

  await Message.create({
    conversation: conversation._id,
    senderName: submission.name,
    senderRole: "contact_form",
    senderEmail: submission.email,
    body: submission.message
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      submission,
      conversation
    },
    message: "Contact form submitted"
  });
});

export const listNewsletterSubscribers = asyncHandler(async (_req, res) => {
  const subscribers = await NewsletterSubscriber.find().sort("-createdAt").lean();
  res.json({ success: true, data: subscribers });
});

export const listNewsletterCampaigns = asyncHandler(async (_req, res) => {
  const campaigns = await NewsletterCampaign.find().sort("-createdAt").lean();
  res.json({ success: true, data: campaigns });
});

export const listContactSubmissions = asyncHandler(async (_req, res) => {
  const submissions = await ContactSubmission.find()
    .populate("vendor", "storeName storeSlug email")
    .sort("-createdAt")
    .lean();
  res.json({ success: true, data: submissions });
});

export const sendLatestCategoriesNewsletter = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort("-createdAt").limit(6).lean();
  const subscribers = await NewsletterSubscriber.find({ status: "subscribed" }).lean();

  if (!subscribers.length) throw new ApiError(StatusCodes.BAD_REQUEST, "No newsletter subscribers found");

  const subject = req.body.subject?.trim() || "Latest marketplace categories";
  const previewText = req.body.previewText?.trim() || "Explore the newest categories from the marketplace.";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;">
      <h1 style="font-size:28px;margin-bottom:12px;">Latest marketplace categories</h1>
      <p style="font-size:16px;line-height:1.6;color:#475569;">${escapeHtml(previewText)}</p>
      <div style="margin-top:24px;">
        ${categories
          .map(
            (category) => `
              <div style="padding:16px;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;">
                <h2 style="font-size:20px;margin:0 0 8px;">${escapeHtml(category.name)}</h2>
                <p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 8px;">${escapeHtml(category.description || "Browse this latest category on the marketplace.")}</p>
                <a href="${req.protocol}://${req.get("host").replace(/:5000$/, ":3000")}/category/${category.slug}" style="color:#0f172a;font-weight:600;">View category</a>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  const delivery = await sendEmail({
    to: subscribers.map((subscriber) => subscriber.email),
    subject,
    html
  });

  const campaign = await NewsletterCampaign.create({
    subject,
    previewText,
    html,
    categoryIds: categories.map((category) => category._id),
    sentCount: subscribers.length,
    deliveryMode: delivery.mode,
    createdBy: req.user._id
  });

  await NewsletterSubscriber.updateMany(
    { _id: { $in: subscribers.map((subscriber) => subscriber._id) } },
    { $set: { lastSentAt: new Date() } }
  );

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: campaign,
    message: delivery.delivered
      ? `Newsletter sent to ${subscribers.length} subscribers`
      : `Newsletter recorded for ${subscribers.length} subscribers. Configure Resend env vars to deliver real email.`
  });
});
