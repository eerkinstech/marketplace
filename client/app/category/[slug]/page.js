import { notFound } from "next/navigation";
import { ProductsCatalogView } from "@/components/storefront/ProductsCatalogView";
import { marketplaceApi } from "@/lib/api/marketplace";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: categories } = await marketplaceApi.safeGetCategories();
  const category = categories.find((entry) => entry.slug === slug);

  if (!category) {
    return {
      title: "Category not found",
      description: "The requested category could not be found."
    };
  }

  return {
    title: `${category.name} category`,
    description: category.description || `Browse products in the ${category.name} category.`
  };
}

export default async function CategoryDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const filters = await searchParams;
  const query = new URLSearchParams();

  query.set("category", slug);
  query.set("limit", filters.limit || "24");
  if (filters.search) query.set("search", filters.search);
  if (filters.sort) query.set("sort", filters.sort);
  if (filters.minPrice) query.set("minPrice", filters.minPrice);
  if (filters.maxPrice) query.set("maxPrice", filters.maxPrice);
  if (filters.stock) query.set("stock", filters.stock);

  const [{ data: categories }, { data: productData }] = await Promise.all([
    marketplaceApi.safeGetCategories(),
    marketplaceApi.safeGetProducts(`?${query.toString()}`)
  ]);

  const category = categories.find((entry) => entry.slug === slug);
  if (!category) notFound();

  return (
    <ProductsCatalogView
      params={filters}
      categories={categories}
      productData={productData}
      title={category.name}
      eyebrow="Category collection"
      bottomDescription={category.description || ""}
      action={`/category/${category.slug}`}
      backLink={{ href: "/products", label: "All products" }}
      lockedCategory={category}
      quickLinkBasePath="/category"
      showQuickLinks={false}
    />
  );
}
