import { ProductsCatalogView } from "@/components/storefront/ProductsCatalogView";
import { marketplaceApi } from "@/lib/api/marketplace";
import { SITE_NAME } from "@/lib/constants/site";

export const metadata = {
  title: "Products",
  description: `Browse products, categories, and marketplace sellers on ${SITE_NAME}.`,
  alternates: {
    canonical: "/products"
  },
  openGraph: {
    type: "website",
    title: "Products",
    description: `Browse products, categories, and marketplace sellers on ${SITE_NAME}.`,
    url: "/products"
  }
};

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.sort) query.set("sort", params.sort);
  if (params.minPrice) query.set("minPrice", params.minPrice);
  if (params.maxPrice) query.set("maxPrice", params.maxPrice);
  if (params.stock) query.set("stock", params.stock);
  query.set("limit", params.limit || "24");

  const [{ data: productData }, { data: categories }] = await Promise.all([
    marketplaceApi.safeGetProducts(`?${query.toString()}`),
    marketplaceApi.safeGetCategories()
  ]);

  return (
    <ProductsCatalogView params={params} categories={categories} productData={productData} />
  );
}
