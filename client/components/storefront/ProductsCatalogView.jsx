"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ProductCard } from "@/components/shared/ProductCard";

function FilterIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function DrawerForm({ params, categories, onClose, action = "/products", lockedCategory }) {
  return (
    <form className="grid gap-4" action={action} onSubmit={onClose}>
      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</label>
        <input
          name="search"
          placeholder="Search products"
          defaultValue={params.search || ""}
          className="field-input bg-white"
        />
      </div>

      {lockedCategory ? (
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Collection</label>
          <div className="field-input flex items-center bg-[#f8f5ef] text-sm font-semibold text-ink">
            {lockedCategory.name}
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Category</label>
          <select name="category" defaultValue={params.category || ""} className="field-input bg-white">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category.slug}>{category.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sort</label>
        <select name="sort" defaultValue={params.sort || "newest"} className="field-input bg-white">
          <option value="newest">Newest</option>
          <option value="popular">Most popular</option>
          <option value="rating">Top rated</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Min price</label>
          <input
            name="minPrice"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            defaultValue={params.minPrice || ""}
            className="field-input bg-white"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Max price</label>
          <input
            name="maxPrice"
            type="number"
            min="0"
            step="1"
            placeholder="500"
            defaultValue={params.maxPrice || ""}
            className="field-input bg-white"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Stock</label>
        <select name="stock" defaultValue={params.stock || ""} className="field-input bg-white">
          <option value="">All products</option>
          <option value="in">In stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      <div className="grid gap-3 pt-3 sm:grid-cols-2">
        <button className="btn-primary rounded-2xl" type="submit">Apply filters</button>
        <Link href={action} className="btn-secondary rounded-2xl text-center" onClick={onClose}>Reset</Link>
      </div>
    </form>
  );
}

export function ProductsCatalogView({
  params,
  categories,
  productData,
  title = "Products",
  eyebrow = "Catalog results",
  
  bottomDescription = "",
  action = "/products",
  backLink,
  lockedCategory = null,
  quickLinkBasePath = "/products",
  showQuickLinks = true
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === params.category) || null,
    [categories, params.category]
  );

  const activeCategory = lockedCategory || selectedCategory;
  const resultCount = productData.pagination?.total || productData.items.length;
  const hasFilters = Boolean(params.search || params.minPrice || params.maxPrice || params.stock || (params.sort && params.sort !== "newest") || (!lockedCategory && params.category));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  return (
    <section className="shell-container py-6">
      <div
        className="rounded-[32px] border border-black/8 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-5"
        style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--white) 94%, transparent) 0%, color-mix(in srgb, var(--secondary) 32%, var(--white)) 100%)" }}
      >
        <div className="mb-5 flex flex-col gap-4 border-b border-black/8 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h2 className="mt-2 page-title text-ink">{title}</h2>
          
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {backLink ? (
              <Link href={backLink.href} className="btn-secondary rounded-[20px] px-4 py-3 text-sm">
                {backLink.label}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-[20px] bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              <FilterIcon />
              Filters
            </button>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
        
          {params.search ? (
            <div className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-slate-700">
              Search: {params.search}
            </div>
          ) : null}
          {params.sort ? (
            <div className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-slate-700">
              Sort: {params.sort.replaceAll("_", " ")}
            </div>
          ) : null}
          {params.minPrice || params.maxPrice ? (
            <div className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-slate-700">
              Price: {params.minPrice || "0"} - {params.maxPrice || "Any"}
            </div>
          ) : null}
          {params.stock ? (
            <div className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm text-slate-700">
              {params.stock === "in" ? "In stock" : "Out of stock"}
            </div>
          ) : null}
          {hasFilters ? (
            <Link href={action} className="text-sm font-semibold text-[color:var(--accent)] transition hover:text-ink">
              Clear filters
            </Link>
          ) : null}
        </div>

        {productData.items.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {productData.items.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        ) : (
          <div className="surface-panel p-8 text-sm text-slate-600">
            No products matched this filter set. Adjust the search terms or switch to another category.
          </div>
        )}

      
      </div>
  {bottomDescription ? (
   
          <div className="mt-6 rounded-[24px] border border-black/8 bg-white/75 px-5 py-5 text-sm leading-7 text-slate-600">
             <h2 className="text-2xl mb-3 font-bold text-ink">About this category</h2>
            {bottomDescription}
          </div>
        ) : null}
      {mounted ? createPortal(
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-300 ease-out ${drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={() => setDrawerOpen(false)}
        >
          <div className={`fixed inset-0 bg-[rgba(12,18,28,0.38)] backdrop-blur-[3px] transition-opacity duration-300 ease-out ${drawerOpen ? "opacity-100" : "opacity-0"}`} />
          <div
            className={`fixed inset-y-0 right-0 flex h-[100dvh] min-h-[100dvh] w-full max-w-md flex-col overflow-hidden border-l border-black/8 bg-[#fcfaf7] shadow-[0_24px_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out will-change-transform ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="border-b border-black/8 px-5 py-5"
              style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--white) 90%, transparent) 0%, color-mix(in srgb, var(--secondary) 18%, var(--white)) 100%)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="eyebrow">Refine results</div>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-ink">Filters</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Narrow the catalog by search, category, and sort order.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white text-slate-700 transition hover:bg-[#f4efe5]"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="rounded-[24px] border border-black/8 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
                <DrawerForm
                  params={params}
                  categories={categories}
                  onClose={() => setDrawerOpen(false)}
                  action={action}
                  lockedCategory={lockedCategory}
                />
              </div>

              {showQuickLinks ? (
                <div className="mt-5 rounded-[24px] border border-black/8 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick links</div>
                  <div className="mt-4 grid gap-3">
                    {categories.slice(0, 12).map((category) => (
                      <Link
                        key={category._id}
                        href={lockedCategory ? `${quickLinkBasePath}/${category.slug}` : `${quickLinkBasePath}?category=${category.slug}`}
                        onClick={() => setDrawerOpen(false)}
                        className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#f8f5ef]"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-black/8 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current category</div>
                  <div className="mt-4 rounded-2xl border border-black/8 bg-[#f8f5ef] px-4 py-4">
                    <div className="text-sm font-semibold text-ink">{lockedCategory?.name || "Category"}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">
                      Filters here apply only to this category page.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </section>
  );
}
