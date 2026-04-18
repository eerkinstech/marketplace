import { ProductsCatalogView } from "@/components/storefront/ProductsCatalogView";
import { marketplaceApi } from "@/lib/api/marketplace";

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
