import { CategoryCard } from "@/components/storefront/CategoryCard";
import { marketplaceApi } from "@/lib/api/marketplace";
import { SITE_NAME } from "@/lib/constants/site";

export const metadata = {
  title: "Categories",
  description: `Browse all shopping categories and collections on ${SITE_NAME}.`,
  alternates: {
    canonical: "/categories"
  },
  openGraph: {
    type: "website",
    title: "Categories",
    description: `Browse all shopping categories and collections on ${SITE_NAME}.`,
    url: "/categories"
  }
};

export default async function CategoriesPage() {
  const { data: categories } = await marketplaceApi.safeGetCategories();

  return (
    <section className="shell-container pb-12">
      <div
        className="mb-8 rounded-[32px] border border-black/8 px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:px-6"
        style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--white) 96%, transparent) 0%, color-mix(in srgb, var(--secondary) 28%, var(--white)) 100%)" }}
      >
        <div className="eyebrow">Browse collections</div>
        <h1 className="mt-2 page-title text-ink">All Categories</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Explore the marketplace through a cleaner category grid with quick entry into each collection.
        </p>
   
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {categories.length ? categories.map((category) => (
          <CategoryCard key={category._id} category={category} />
        )) : (
          <div className="surface-panel col-span-full p-8 text-sm text-slate-600">
            Categories are not available right now. Start the backend API to load live collections.
          </div>
        )}
      </div>
    </section>
  );
}
