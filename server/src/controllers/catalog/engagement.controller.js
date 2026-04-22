import { StatusCodes } from "http-status-codes";
import { Category } from "../../models/Category.js";
import { ContactSubmission } from "../../models/ContactSubmission.js";
import { Conversation } from "../../models/Conversation.js";
import { Message } from "../../models/Message.js";
import { NewsletterCampaign } from "../../models/NewsletterCampaign.js";
import { NewsletterSubscriber } from "../../models/NewsletterSubscriber.js";
import { User } from "../../models/User.js";
import { sendEmail } from "../../services/notifications/email.service.js";
import { env } from "../../config/env.js";
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

function stripHtml(value = "") {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const socialLinks = [
  { label: "Facebook", icon: "f", href: "https://facebook.com" },
  { label: "Instagram", icon: "ig", href: "https://instagram.com" },
  { label: "X", icon: "x", href: "https://x.com" },
  { label: "LinkedIn", icon: "in", href: "https://linkedin.com" }
];

function wrapEmailTemplate({ subject, messageHtml, previewText = "" }) {
  const websiteUrl = env.clientUrl || "http://localhost:3000";
  const escapedWebsiteUrl = escapeHtml(websiteUrl);
  const styledMessageHtml = messageHtml
    .replace(/<h1([^>]*)>/gi, '<h1$1 style="margin:0 0 18px;font-size:30px;line-height:1.18;font-weight:800;color:#0f172a;">')
    .replace(/<h2([^>]*)>/gi, '<h2$1 style="margin:0 0 16px;font-size:25px;line-height:1.22;font-weight:800;color:#0f172a;">')
    .replace(/<h3([^>]*)>/gi, '<h3$1 style="margin:0 0 14px;font-size:21px;line-height:1.28;font-weight:750;color:#0f172a;">')
    .replace(/<h4([^>]*)>/gi, '<h4$1 style="margin:0 0 12px;font-size:18px;line-height:1.35;font-weight:750;color:#0f172a;">')
    .replace(/<h5([^>]*)>/gi, '<h5$1 style="margin:0 0 10px;font-size:15px;line-height:1.4;font-weight:750;color:#0f172a;text-transform:uppercase;letter-spacing:0.08em;">')
    .replace(/<h6([^>]*)>/gi, '<h6$1 style="margin:0 0 10px;font-size:15px;line-height:1.4;font-weight:750;color:#0f172a;text-transform:uppercase;letter-spacing:0.08em;">')
    .replace(/<p([^>]*)>/gi, '<p$1 style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#475569;">')
    .replace(/<ul([^>]*)>/gi, '<ul$1 style="margin:0 0 16px 22px;padding:0;color:#475569;list-style:disc;">')
    .replace(/<ol([^>]*)>/gi, '<ol$1 style="margin:0 0 16px 22px;padding:0;color:#475569;list-style:decimal;">')
    .replace(/<li([^>]*)>/gi, '<li$1 style="margin:0 0 8px;padding-left:4px;font-size:15px;line-height:1.65;">')
    .replace(/<blockquote([^>]*)>/gi, '<blockquote$1 style="margin:0 0 16px;border-left:4px solid #cbd5e1;padding-left:14px;color:#64748b;font-style:italic;">')
    .replace(/<a /gi, '<a style="color:#1d5c54;font-weight:700;text-decoration:underline;" ');

  return `
    <div style="margin:0;background:#f8fafc;padding:28px 16px;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
        <div style="padding:24px 28px;border-bottom:1px solid #e2e8f0;background:#0f172a;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#cbd5e1;">MarketSphere</div>
          <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;">${escapeHtml(subject)}</h1>
        </div>
        <div style="padding:28px;font-size:16px;line-height:1.7;color:#334155;">
          ${styledMessageHtml}
       
        </div>
        <div style="padding:22px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.6;text-align:center;">
          <div style="margin-bottom:14px;">
             <div style="margin-bottom:28px; text-align:center;">
            <a href="${escapedWebsiteUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:12px;padding:13px 18px;font-size:14px;font-weight:700;">Visit website</a>
          </div>
            ${socialLinks.map((link) => `
              <a href="${escapeHtml(link.href)}" aria-label="${escapeHtml(link.label)}" style="display:inline-block;width:34px;height:34px;line-height:34px;margin-right:8px;border-radius:999px;background:#0f172a;color:#ffffff;text-align:center;text-decoration:none;font-size:11px;font-weight:700;text-transform:uppercase;">${escapeHtml(link.icon)}</a>
            `).join("")}
          </div>
          <div>
            <a href="${escapedWebsiteUrl}" style="color:#0f172a;font-weight:700;text-decoration:none; display:block; text-align:center;">${escapedWebsiteUrl}</a>
          </div>
          <div style="margin-top:8px; text-align:center; line-height:1.6;">You are receiving this message because you have a customer account with MarketSphere.</div>
        </div>
      </div>
    </div>
  `;
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
    campaignType: "latest_categories",
    audience: "subscribers",
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
      : `Newsletter recorded for ${subscribers.length} subscribers. Configure SMTP env vars to deliver real email.`
  });
});

export const sendCustomCustomerEmail = asyncHandler(async (req, res) => {
  const subject = String(req.body.subject || "").trim();
  const messageHtml = String(req.body.messageHtml || "").trim();
  const customerIds = Array.isArray(req.body.customerIds)
    ? [...new Set(req.body.customerIds.map((id) => String(id || "").trim()).filter(Boolean))]
    : [];
  const previewText = stripHtml(messageHtml).slice(0, 160);

  if (!subject) throw new ApiError(StatusCodes.BAD_REQUEST, "Subject is required");
  if (!stripHtml(messageHtml)) throw new ApiError(StatusCodes.BAD_REQUEST, "Message is required");
  if (!customerIds.length) throw new ApiError(StatusCodes.BAD_REQUEST, "Select at least one customer");

  const customers = await User.find({ _id: { $in: customerIds }, role: "customer", status: "active" }).select("email").lean();
  if (customers.length !== customerIds.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "One or more selected customers are invalid");
  }

  const recipients = [...new Set(customers.map((customer) => customer.email).filter(Boolean))];

  if (!recipients.length) throw new ApiError(StatusCodes.BAD_REQUEST, "Selected customers do not have email addresses");

  const html = wrapEmailTemplate({ subject, messageHtml, previewText });
  const delivery = await sendEmail({
    to: recipients,
    subject,
    html
  });

  const campaign = await NewsletterCampaign.create({
    subject,
    campaignType: "custom_customer",
    audience: "customers",
    previewText,
    html,
    sentCount: recipients.length,
    deliveryMode: delivery.mode,
    createdBy: req.user._id
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: campaign,
    message: delivery.delivered
      ? `Email sent to ${recipients.length} customers`
      : `Email recorded for ${recipients.length} customers. Configure SMTP env vars to deliver real email.`
  });
});
