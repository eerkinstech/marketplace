import { Media } from "../../models/Media.js";

export async function syncMediaLibraryImages(ownerId, images = []) {
  if (!ownerId || !Array.isArray(images) || !images.length) return;

  const existingItems = await Media.find({ owner: ownerId })
    .select("url publicId")
    .lean();

  const existingKeys = new Set(
    existingItems.map((item) => item.publicId || item.url).filter(Boolean)
  );

  const nextItems = images
    .filter((image) => image?.url)
    .filter((image) => !existingKeys.has(image.publicId || image.url))
    .map((image) => ({
      owner: ownerId,
      url: image.url,
      publicId: image.publicId || "",
      alt: image.alt || ""
    }));

  if (!nextItems.length) return;
  await Media.insertMany(nextItems);
}
