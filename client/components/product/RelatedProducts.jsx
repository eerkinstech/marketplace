"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/shared/ProductCard";
import { marketplaceApi } from "@/lib/api/marketplace";

export function RelatedProducts({ product }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const categorySlug = product?.category?.slug || product?.categorySlug || "";

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
    <section className="pb-4">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">More to explore</div>
        <h2 className="mt-2 font-display text-3xl text-ink">Related products</h2>
      </div>
      <div className="product-grid">
        {relatedProducts.map((relatedProduct) => (
          <ProductCard key={relatedProduct._id} product={relatedProduct} />
        ))}
      </div>
    </section>
  );
}
