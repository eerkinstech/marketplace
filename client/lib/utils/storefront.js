import { getImageSource } from "@/lib/utils/images";

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function getProductImage(product) {
  return getImageSource(product?.images?.[0]);
}

export function getDiscountPercent(product) {
  if (!product?.compareAtPrice || product.compareAtPrice <= product.price) return 0;
  return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
}
