"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/shared/ProductCard";
import { marketplaceApi } from "@/lib/api/marketplace";

export function RelatedProducts({ product }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const categorySlug = product?.category?.slug || product?.categorySlug || "";
  const categoryName = product?.category?.name || "This category";

  useEffect(() => {
    let active = true;

    async function loadRelatedProducts() {
      if (!categorySlug) {
        setRelatedProducts([]);
        return;
      }

      try {
        const response = await marketplaceApi.getProducts(`?category=${categorySlug}&limit=8`);
        if (!active) return;
        const items = Array.isArray(response?.data?.items) ? response.data.items : [];
        setRelatedProducts(items.filter((item) => item?._id !== product?._id).slice(0, 4));
      } catch {
        if (active) setRelatedProducts([]);
      }
    }

    loadRelatedProducts();
    return () => {
      active = false;
    };
  }, [categorySlug, product?._id]);

  if (!relatedProducts.length) return null;

  return (
    <section
      className="overflow-hidden rounded-[32px] border border-black/8 px-5 py-6 shadow-[0_24px_54px_rgba(16,32,26,0.06)] sm:px-7 sm:py-8"
      style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--white) 94%, var(--secondary)) 0%, color-mix(in srgb, var(--background) 88%, var(--white)) 100%)" }}
    >
      <div className="mb-6 flex flex-col gap-4 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">More to explore</div>
          <h2 className="mt-2 font-display text-3xl text-ink">Related products</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            More picks from {categoryName.toLowerCase()} that fit the same storefront style and shopping flow.
          </p>
        </div>
        <div className="inline-flex self-start rounded-full border border-black/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600" style={{ background: "color-mix(in srgb, var(--white) 82%, var(--background))" }}>
          {relatedProducts.length} products
        </div>
      </div>
      <div className="product-grid">
        {relatedProducts.map((relatedProduct) => (
          <ProductCard key={relatedProduct._id} product={relatedProduct} />
        ))}
      </div>
    </section>
  );
}
