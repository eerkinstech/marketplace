import { marketplaceApi } from "@/lib/api/marketplace";

export async function loadDesignedPageSeo(key) {
  const response = await marketplaceApi.safeGetSeoPage(key);
  return response?.data || null;
}

export function buildDesignedPageMetadata(fallbackTitle, seoPage) {
  return {
    title: seoPage?.metaTitle || fallbackTitle,
    description: seoPage?.metaDescription || undefined
  };
}
