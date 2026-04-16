"use client";

const WISHLIST_KEY = "marketplace_wishlist";

function normalizeOptions(optionValues) {
  if (!optionValues || typeof optionValues !== "object") return {};

  return Object.keys(optionValues)
    .sort()
    .reduce((acc, key) => {
      const value = optionValues[key];
      if (value === undefined || value === null || value === "") return acc;
      acc[key] = String(value);
      return acc;
    }, {});
}

export function buildWishlistKey(item = {}) {
  const productId = String(item?.productId || item?._id || item?.slug || "");
  const variantId = String(item?.variantId || "");
  const variantSku = String(item?.variantSku || item?.sku || "");
  const normalizedOptions = normalizeOptions(item?.optionValues || item?.selectedOptions);
  const optionKey = Object.entries(normalizedOptions)
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

  return [productId, variantId, variantSku, optionKey].join("::");
}

function read() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(WISHLIST_KEY) || "[]").map((item) => ({
      ...item,
      wishlistKey: item?.wishlistKey || buildWishlistKey(item)
    }));
  } catch {
    return [];
  }
}

function write(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("wishlist:updated", { detail: { items } }));
}

function resolveId(itemOrId) {
  if (typeof itemOrId === "string") return itemOrId;
  return itemOrId?.wishlistKey || buildWishlistKey(itemOrId);
}

export const wishlistStore = {
  getItems: read,
  has(itemOrId) {
    const id = resolveId(itemOrId);
    return read().some((item) => resolveId(item) === id);
  },
  toggle(item) {
    const id = resolveId(item);
    const items = read();
    const exists = items.some((entry) => resolveId(entry) === id);
    if (exists) {
      write(items.filter((entry) => resolveId(entry) !== id));
      return false;
    }
    write([{ ...item, productId: item?.productId || item?._id || item?.slug, wishlistKey: id }, ...items]);
    return true;
  },
  remove(itemOrId) {
    const id = resolveId(itemOrId);
    write(read().filter((item) => resolveId(item) !== id));
  },
  clear() {
    write([]);
  }
};
