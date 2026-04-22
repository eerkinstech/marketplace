import { marketplaceApi } from "@/lib/api/marketplace";
import { cleanMetaDescription, cleanPageTitle } from "@/lib/utils/metadata";

export async function loadDesignedPageSeo(key) {
  const response = await marketplaceApi.safeGetSeoPage(key);
  return response?.data || null;
}

export function buildDesignedPageMetadata(fallbackTitle, seoPage, canonicalPath = "") {
  const title = cleanPageTitle(seoPage?.metaTitle, fallbackTitle);
  const description = cleanMetaDescription(seoPage?.metaDescription);

  return {
    title,
    description,
    alternates: canonicalPath ? {
      canonical: canonicalPath
    } : undefined,
    openGraph: canonicalPath ? {
      type: "website",
      title,
      description,
      url: canonicalPath
    } : undefined
  };
}
