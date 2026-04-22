const browserApiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
const serverApiUrl = process.env.INTERNAL_API_URL || "http://localhost:5000/api";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.CLIENT_URL || "http://localhost:3000";

export const API_URL = typeof window === "undefined" ? serverApiUrl : browserApiUrl;
export const SITE_URL = siteUrl.replace(/\/+$/, "");
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "MarketSphere";
export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "Shop curated products from trusted marketplace sellers across categories, stores, and collections.";
export const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "USD";
