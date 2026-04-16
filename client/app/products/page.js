import Link from "next/link";
import { PageIntro } from "@/components/storefront/PageIntro";
import { ProductCard } from "@/components/shared/ProductCard";
import { marketplaceApi } from "@/lib/api/marketplace";

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.sort) query.set("sort", params.sort);
  query.set("limit", params.limit || "24");

  const [{ data: productData }, { data: categories }] = await Promise.all([
    marketplaceApi.safeGetProducts(`?${query.toString()}`),
    marketplaceApi.safeGetCategories()
  ]);

  return (
    <>
      <PageIntro
        eyebrow="All products"
        title="Marketplace catalog built for fast scanning and confident decisions."
        description="Browse approved listings with category filters, clear pricing, and direct product pages for deeper detail."
        actions={[
          { href: "/categories", label: "See categories", variant: "secondary" },
          { href: "/cart", label: "Open cart" }
        ]}
        stats={[
          { label: "Products", value: productData.pagination?.total || productData.items.length, caption: "Approved catalog items" },
          { label: "Sort", value: params.sort || "newest", caption: "Current ordering" },
          { label: "Categories", value: categories.length, caption: "Active collections" }
        ]}
      />
      <section className="shell-container pb-12">
        <div className="catalog-layout">
          <aside className="catalog-sidebar">
            <div className="surface-panel p-5">
              <div className="eyebrow">Refine results</div>
              <form className="mt-4 grid gap-3">
                <input
                  name="search"
                  placeholder="Search products"
                  defaultValue={params.search || ""}
                  className="field-input"
                />
                <select name="category" defaultValue={params.category || ""} className="field-input">
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.slug}>{category.name}</option>
                  ))}
                </select>
                <select name="sort" defaultValue={params.sort || "newest"} className="field-input">
                  <option value="newest">Newest</option>
                  <option value="popular">Most popular</option>
                  <option value="rating">Top rated</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                </select>
                <button className="btn-primary" type="submit">Apply filters</button>
              </form>
            </div>
            <div className="surface-panel p-5">
              <div className="eyebrow">Collections</div>
              <div className="mt-4 grid gap-3">
                {categories.map((category) => (
                  <Link key={category._id} href={`/category/${category.slug}`} className="rounded-2xl border border-black/8 bg-white/70 px-4 py-3 text-sm transition hover:bg-white">
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
          <div>
            <div className="section-heading mb-5">
              <div>
                <div className="eyebrow">Catalog results</div>
                <h2 className="page-title mt-2">Products</h2>
              </div>
              <div className="small">{productData.pagination?.total || productData.items.length} items found</div>
            </div>
            {productData.items.length ? (
              <div className="product-grid">
                {productData.items.map((product) => <ProductCard key={product._id} product={product} />)}
              </div>
            ) : (
              <div className="surface-panel p-8 text-sm text-slate-600">
                No products matched this filter set. Adjust the search terms or switch to another category.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

