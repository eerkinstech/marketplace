import { StatusCodes } from "http-status-codes";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadBufferImage } from "../services/storage/upload.service.js";

function normalizeVendorLabel(vendor) {
  if (!vendor) return "Marketplace";
  return vendor.storeName || vendor.name || vendor.email || "Marketplace";
}

function buildReturnView(entry) {
  return {
    ...entry,
    vendorLabel: normalizeVendorLabel(entry.vendor)
  };
}

async function fetchReturnRequest(filter) {
  const entry = await ReturnRequest.findOne(filter)
    .populate("product", "name slug sku images")
    .populate("customer", "name email phone")
    .populate("vendor", "name storeName email role")
    .populate("order", "createdAt customerName customerEmail customerPhone")
    .lean();

  if (!entry) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Return request not found");
  }

  return buildReturnView(entry);
}

export const createReturnRequest = asyncHandler(async (req, res) => {
  const payload = req.validatedBody;
  const product = await Product.findById(payload.productId)
    .populate("vendor", "name storeName email role")
    .lean();

  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }

  let order = null;
  if (payload.orderId) {
    order = await Order.findById(payload.orderId).lean();
    if (!order) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Order not found");
    }
  }

  const parsedOrderDate = new Date(payload.orderDate);
  if (Number.isNaN(parsedOrderDate.getTime())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Order date is invalid");
  }

  const uploadedProof = await uploadBufferImage(payload.proof || "", "marketplace/returns");
  const returnRequest = await ReturnRequest.create({
    order: order?._id || null,
    orderDate: parsedOrderDate,
    product: product._id,
    vendor: product.vendor?._id || product.vendor,
    customer: req.user?._id || null,
    customerName: payload.name,
    customerEmail: String(payload.email || "").trim().toLowerCase(),
    customerPhone: payload.phone,
    proofUrl: uploadedProof.url || "",
    proofPublicId: uploadedProof.publicId || "",
    reason: payload.reason,
    status: "requested"
  });

  const response = await fetchReturnRequest({ _id: returnRequest._id });
  res.status(StatusCodes.CREATED).json({ success: true, data: response });
});

export const updateVendorReturnStatus = asyncHandler(async (req, res) => {
  const entry = await ReturnRequest.findOne({ _id: req.params.id, vendor: req.user._id });
  if (!entry) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Return request not found");
  }

  entry.status = req.validatedBody.status;
  entry.statusNote = req.validatedBody.statusNote || "";
  await entry.save();

  const response = await fetchReturnRequest({ _id: entry._id, vendor: req.user._id });
  res.json({ success: true, data: response });
});

export const updateAdminReturnStatus = asyncHandler(async (req, res) => {
  const entry = await ReturnRequest.findById(req.params.id);
  if (!entry) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Return request not found");
  }

  entry.status = req.validatedBody.status;
  entry.statusNote = req.validatedBody.statusNote || "";
  await entry.save();

  const response = await fetchReturnRequest({ _id: entry._id });
  res.json({ success: true, data: response });
});
