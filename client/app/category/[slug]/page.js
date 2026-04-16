import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/storefront/PageIntro";
import { ProductCard } from "@/components/shared/ProductCard";
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

export default async function CategoryDetailPage({ params }) {
  const { slug } = await params;
  const [{ data: categories }, { data: productData }] = await Promise.all([
    marketplaceApi.safeGetCategories(),
    marketplaceApi.safeGetProducts(`?category=${slug}&limit=24`)
  ]);

  const category = categories.find((entry) => entry.slug === slug);
  if (!category) notFound();

  return (
    <>
      <PageIntro
        eyebrow="Category detail"
        title={category.name}
        description={category.description || "A focused collection of marketplace products from approved sellers."}
        actions={[
          { href: "/categories", label: "All categories", variant: "secondary" },
          { href: `/products?category=${category.slug}`, label: "View in catalog" }
        ]}
        stats={[
          { label: "Products", value: productData.pagination?.total || productData.items.length, caption: "Available in this category" },
          { label: "Slug", value: category.slug, caption: "Category path" },
          { label: "Browse mode", value: "Focused", caption: "Collection-led shopping" }
        ]}
      />
      <section className="shell-container pb-12">
        <div className="section-heading mb-5">
          <div>
            <div className="eyebrow">Collection products</div>
            <h2 className="page-title mt-2">Shop {category.name}</h2>
          </div>
          <Link href="/products" className="soft-link">
            Back to all products
          </Link>
        </div>
        {productData.items.length ? (
          <div className="product-grid">
            {productData.items.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        ) : (
          <div className="surface-panel p-8 text-sm text-slate-600">
            No approved products are visible in this category yet.
          </div>
        )}
      </section>
    </>
  );
}

