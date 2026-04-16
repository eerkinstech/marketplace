import { StatusCodes } from "http-status-codes";
import { Media } from "../models/Media.js";
import { User } from "../models/User.js";
import { deleteUploadedImage, uploadBufferImage } from "../services/storage/upload.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

function normalizeOwnerLabel(owner) {
  if (!owner) return "Marketplace";
  return owner.storeName || owner.name || owner.email || "Marketplace";
}

function getMediaFilter(req) {
  return req.user.role === "admin" ? {} : { owner: req.user._id };
}

export const listMediaLibrary = asyncHandler(async (req, res) => {
  const items = await Media.find(getMediaFilter(req))
    .populate("owner", "name storeName email role")
    .sort("-createdAt")
    .lean();

  res.json({
    success: true,
    data: items.map((item) => ({
      ...item,
      ownerLabel: normalizeOwnerLabel(item.owner)
    }))
  });
});

export const uploadMediaLibrary = asyncHandler(async (req, res) => {
  const rawImages = Array.isArray(req.body.images) ? req.body.images : [];
  if (!rawImages.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Add at least one image.");
  }

  const uploads = await Promise.all(
    rawImages.map((image) => uploadBufferImage(image, "marketplace/media"))
  );

  const created = await Media.insertMany(
    uploads.map((upload) => ({
      owner: req.user._id,
      url: upload.url,
      publicId: upload.publicId,
      alt: ""
    }))
  );

  const owner = await User.findById(req.user._id).select("name storeName email role").lean();

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: created.map((item) => ({
      ...item.toObject(),
      owner,
      ownerLabel: normalizeOwnerLabel(owner)
    }))
  });
});

export const deleteMediaItem = asyncHandler(async (req, res) => {
  const item = await Media.findOne({ _id: req.params.id, ...getMediaFilter(req) });
  if (!item) throw new ApiError(StatusCodes.NOT_FOUND, "Media not found");

  await deleteUploadedImage(item.publicId);
  await item.deleteOne();

  res.json({ success: true, message: "Media deleted" });
});

export const bulkDeleteMediaItems = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  if (!ids.length) throw new ApiError(StatusCodes.BAD_REQUEST, "Select at least one image.");

  const items = await Media.find({ _id: { $in: ids }, ...getMediaFilter(req) });
  if (!items.length) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Media not found");
  }

  await Promise.all(items.map((item) => deleteUploadedImage(item.publicId)));
  await Media.deleteMany({ _id: { $in: items.map((item) => item._id) } });

  res.json({ success: true, message: `${items.length} image(s) deleted.` });
});
