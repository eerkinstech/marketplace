"use client";

const CART_KEY = "marketplace_cart";
const COUPON_KEY = "marketplace_cart_coupon";

function resolveItemKey(itemOrKey) {
  if (typeof itemOrKey === "string") return itemOrKey;
  return itemOrKey?.cartKey || itemOrKey?.productId;
}

function normalizeOptionValues(optionValues) {
  if (!optionValues || typeof optionValues !== "object") return {};
  return Object.fromEntries(
    Object.entries(optionValues)
      .filter(([key, value]) => Boolean(key) && value !== undefined && value !== null && String(value).trim())
      .map(([key, value]) => [String(key), String(value)])
  );
}

function normalizeCartItem(item) {
  const productId = String(item?.productId || item?._id || "").trim();
  if (!productId) return null;

  const quantity = Math.max(1, Number(item?.quantity || 1));
  const variantSku = String(item?.variantSku || item?.sku || "").trim();
  const optionValues = normalizeOptionValues(item?.optionValues || item?.selectedOptions);
  const cartKey = String(
    item?.cartKey || [productId, variantSku || JSON.stringify(optionValues) || "default"].join(":")
  );

  return {
    ...item,
    productId,
    cartKey,
    quantity,
    variantSku,
    optionValues,
    variantLabel: String(item?.variantLabel || ""),
    name: String(item?.name || ""),
    slug: String(item?.slug || ""),
    image: String(item?.image || ""),
    price: Number(item?.price || 0),
    weight: Number(item?.weight || 0)
  };
}

function read() {
  if (typeof window === "undefined") return [];
  try {
    const items = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(items) ? items.map(normalizeCartItem).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function write(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: { items } }));
}

function readCoupon() {
  if (typeof window === "undefined") return "";
  return String(window.localStorage.getItem(COUPON_KEY) || "").trim().toUpperCase();
}

function writeCoupon(code) {
  if (typeof window === "undefined") return;
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (normalizedCode) {
    window.localStorage.setItem(COUPON_KEY, normalizedCode);
  } else {
    window.localStorage.removeItem(COUPON_KEY);
  }
  window.dispatchEvent(new CustomEvent("cart:coupon-updated", { detail: { code: normalizedCode } }));
}

export const cartStore = {
  getItems: read,
  getCoupon: readCoupon,
  add(item) {
    const items = read();
    const itemKey = resolveItemKey(item);
    const existing = items.find((entry) => resolveItemKey(entry) === itemKey);
    if (existing) existing.quantity += item.quantity;
    else items.push({ ...item, cartKey: itemKey });
    write(items);
  },
  clear() {
    write([]);
    writeCoupon("");
  },
  clearCoupon() {
    writeCoupon("");
  },
  remove(itemKey) {
    write(read().filter((item) => resolveItemKey(item) !== itemKey));
  },
  setCoupon(code) {
    writeCoupon(code);
  },
  setQuantity(itemKey, quantity) {
    const nextQuantity = Math.max(1, quantity);
    const items = read().map((item) => (
      resolveItemKey(item) === itemKey ? { ...item, quantity: nextQuantity } : item
    ));
    write(items);
  }
};

