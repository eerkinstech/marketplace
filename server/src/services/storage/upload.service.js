import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, "../../../uploads");

const mimeExtensionMap = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif"
};

function normalizeFolder(folder = "marketplace") {
  return String(folder)
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9-_]/g, ""))
    .filter(Boolean)
    .join("/");
}

function parseDataUrl(value) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(value || "");
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], "base64")
  };
}

function toPublicUploadUrl(folder, fileName) {
  const normalizedFolder = normalizeFolder(folder);
  const relativePath = normalizedFolder ? `${normalizedFolder}/${fileName}` : fileName;
  return `${env.serverUrl}/uploads/${relativePath}`;
}

export const uploadBufferImage = async (source, folder = "marketplace") => {
  if (!source || typeof source !== "string") {
    return { url: "", publicId: "" };
  }

  if (!source.startsWith("data:")) {
    return { url: source, publicId: "" };
  }

  const parsed = parseDataUrl(source);
  if (!parsed) {
    return { url: source, publicId: "" };
  }

  const extension = mimeExtensionMap[parsed.mimeType];
  if (!extension) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Unsupported image format. Use JPG, PNG, WEBP, GIF, SVG, or AVIF."
    );
  }

  const normalizedFolder = normalizeFolder(folder);
  const targetDirectory = path.join(uploadsRoot, normalizedFolder);
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const targetPath = path.join(targetDirectory, fileName);

  await fs.mkdir(targetDirectory, { recursive: true });
  await fs.writeFile(targetPath, parsed.buffer);

  return {
    url: toPublicUploadUrl(normalizedFolder, fileName),
    publicId: normalizedFolder ? `${normalizedFolder}/${fileName}` : fileName
  };
};

export const deleteUploadedImage = async (publicId) => {
  if (!publicId || typeof publicId !== "string") return;

  const normalizedPublicId = normalizeFolder(path.dirname(publicId))
    ? `${normalizeFolder(path.dirname(publicId))}/${path.basename(publicId)}`
    : path.basename(publicId);

  const targetPath = path.resolve(uploadsRoot, normalizedPublicId);
  if (!targetPath.startsWith(uploadsRoot)) return;

  try {
    await fs.unlink(targetPath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
};
