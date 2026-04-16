import { CategoryCard } from "@/components/storefront/CategoryCard";
import { PageIntro } from "@/components/storefront/PageIntro";
import { marketplaceApi } from "@/lib/api/marketplace";

export default async function CategoriesPage() {
  const [{ data: categories }, { data: productData }] = await Promise.all([
    marketplaceApi.safeGetCategories(),
    marketplaceApi.safeGetProducts("?limit=50")
  ]);

  const counts = productData.items.reduce((accumulator, product) => {
    const key = product.categorySlug || product.category?.slug;
    if (!key) return accumulator;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  return (
    <>
      <PageIntro
        eyebrow="All categories"
        title="Collections that turn a large catalog into a clearer shopping map."
        description="Use category landing pages to move quickly from broad browsing into focused product discovery."
        actions={[
          { href: "/products", label: "Browse all products" },
          { href: "/", label: "Back home", variant: "secondary" }
        ]}
        stats={[
          { label: "Active categories", value: categories.length, caption: "Available for browsing" },
          { label: "Indexed items", value: productData.items.length, caption: "Sampled from the catalog" },
          { label: "Navigation", value: "Focused", caption: "Built for faster exploration" }
        ]}
      />
      <section className="shell-container pb-12">
        <div className="storefront-grid">
          {categories.length ? categories.map((category) => (
            <CategoryCard key={category._id} category={category} productCount={counts[category.slug] || 0} />
          )) : (
            <div className="surface-panel p-8 text-sm text-slate-600">
              Categories are not available right now. Start the backend API to load live collections.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

