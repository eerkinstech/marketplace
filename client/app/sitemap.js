import { marketplaceApi } from "@/lib/api/marketplace";
import { SITE_URL } from "@/lib/constants/site";

const staticRoutes = [
  "",
  "/products",
  "/categories",
  "/about-us",
  "/contact-us",
  "/faqs",
  "/returns"
];

function absoluteUrl(path) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function lastModified(value) {
  return value ? new Date(value) : new Date();
}

export default async function sitemap() {
  let data = { products: [], categories: [], stores: [], pages: [] };

  try {
    const response = await marketplaceApi.getSitemapData();
    data = response.data || data;
  } catch {
    data = { products: [], categories: [], stores: [], pages: [] };
  }

  const dynamicRoutes = [
    ...(data.products || []).map((product) => ({
      url: absoluteUrl(`/product/${product.slug}`),
      lastModified: lastModified(product.updatedAt),
      changeFrequency: "daily",
      priority: 0.8
    })),
    ...(data.categories || []).map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified: lastModified(category.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7
    })),
    ...(data.stores || []).map((store) => ({
      url: absoluteUrl(`/store/${store.storeSlug}`),
      lastModified: lastModified(store.updatedAt),
      changeFrequency: "weekly",
      priority: 0.6
    })),
    ...(data.pages || []).map((page) => ({
      url: absoluteUrl(`/${page.type === "policy" ? "policies" : "pages"}/${page.slug}`),
      lastModified: lastModified(page.updatedAt),
      changeFrequency: "monthly",
      priority: page.type === "policy" ? 0.4 : 0.5
    }))
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route || "/"),
      lastModified: new Date(),
      changeFrequency: route === "" ? "daily" : "weekly",
      priority: route === "" ? 1 : 0.7
    })),
    ...dynamicRoutes
  ];
}
