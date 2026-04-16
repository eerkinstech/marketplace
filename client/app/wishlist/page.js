"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cartStore } from "@/lib/utils/cart-store";
import { wishlistStore } from "@/lib/utils/wishlist-store";
import { formatCurrency } from "@/lib/utils/storefront";

function WishlistIcon({ type, className = "h-5 w-5" }) {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  };

  if (type === "cart") {
    return (
      <svg {...commonProps}>
        <circle cx="9" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
        <path d="M3 5h2l2.2 9h9.8l2-7H7.6" />
      </svg>
    );
  }

  if (type === "trash") {
    return (
      <svg {...commonProps}>
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="M6 7l1 12h10l1-12" />
        <path d="M9 7V4h6v3" />
      </svg>
    );
  }

  return null;
}

function normalizeImage(item) {
  if (typeof item?.image === "string" && item.image) return item.image;
  const firstImage = item?.images?.[0];
  if (typeof firstImage === "string") return firstImage;
  if (firstImage?.url) return firstImage.url;
  return "";
}

function buildCartPayload(item) {
  return {
    cartKey: `${item.productId}:${item.variantSku || item.variantId || item.wishlistKey}`,
    productId: item.productId || item._id,
    variantSku: item.variantSku || item.sku || "",
    optionValues: item.optionValues || item.selectedOptions || {},
    variantLabel: item.variantLabel || "",
    quantity: 1,
    name: item.name,
    price: Number(item.price || 0),
    image: normalizeImage(item),
    slug: item.slug
  };
}

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const sync = () => setItems(wishlistStore.getItems());
    sync();
    window.addEventListener("wishlist:updated", sync);
    return () => window.removeEventListener("wishlist:updated", sync);
  }, []);

  const sortedItems = useMemo(() => {
    const nextItems = [...items];
    if (sortBy === "price_low") return nextItems.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
    if (sortBy === "price_high") return nextItems.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
    if (sortBy === "name") return nextItems.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
    return nextItems.reverse();
  }, [items, sortBy]);

  const totalValue = useMemo(
    () => sortedItems.reduce((sum, item) => sum + Number(item?.price || 0), 0),
    [sortedItems]
  );

  function addSingleToCart(item) {
    cartStore.add(buildCartPayload(item));
  }

  function moveAllToCart() {
    sortedItems.forEach((item) => {
      cartStore.add(buildCartPayload(item));
    });
    wishlistStore.clear();
  }

  if (!items.length) {
    return (
      <section className="page-section px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="rounded-[30px] border border-black/8 bg-white p-10 text-center shadow-[0_16px_40px_rgba(16,32,26,0.06)]">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Wishlist</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">Your wishlist is empty</h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              Save products and variants from the product page to keep them here for later.
            </p>
            <div className="mt-8">
              <Link href="/products" className="inline-flex h-12 items-center justify-center rounded-[16px] bg-[#b8742f] px-7 text-sm font-bold text-white transition hover:bg-[#9f6428]">
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-black/8 bg-white px-6 py-5 shadow-[0_16px_40px_rgba(16,32,26,0.06)] sm:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label htmlFor="wishlist-sort" className="text-lg font-bold text-ink">
                    Sort by:
                  </label>
                  <select
                    id="wishlist-sort"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="h-12 min-w-[220px] rounded-[16px] border border-black/10 bg-white px-4 text-base text-ink outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="name">Name</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => wishlistStore.clear()}
                  className="inline-flex items-center gap-3 self-start rounded-[18px] px-2 py-2 text-base font-bold text-[#b8742f] transition hover:text-[#9f6428]"
                >
                  <WishlistIcon type="trash" className="h-6 w-6" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {sortedItems.map((item) => {
                const image = normalizeImage(item);
                return (
                  <article
                    key={item.wishlistKey || item.productId || item._id || item.slug}
                    className="rounded-[24px] border border-black/8 bg-white p-4 shadow-[0_14px_34px_rgba(16,32,26,0.06)] sm:p-5"
                  >
                    <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)_160px] lg:items-start">
                      <Link
                        href={item.slug ? `/product/${item.slug}` : "/products"}
                        className="overflow-hidden rounded-[20px] border border-black/8 bg-[#f5efe5]"
                      >
                        <div className="aspect-[1.05/0.72] w-full">
                          {image ? (
                            <img src={image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                              No image
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="min-w-0">
                        <Link
                          href={item.slug ? `/product/${item.slug}` : "/products"}
                          className="text-[1.5rem] font-black tracking-tight text-ink transition hover:text-[#b8742f] sm:text-[1.65rem]"
                        >
                          {item.name}
                        </Link>
                        {item.variantLabel ? (
                          <div className="mt-2 text-base text-slate-700">{item.variantLabel}</div>
                        ) : (
                          <div className="mt-2 text-base text-slate-500">Saved product</div>
                        )}

                        <div className="mt-6 flex flex-wrap gap-4">
                          <button
                            type="button"
                            onClick={() => addSingleToCart(item)}
                            className="inline-flex h-12 items-center justify-center gap-3 rounded-[14px] bg-[#b8742f] px-6 text-base font-bold text-white transition hover:bg-[#9f6428]"
                          >
                            <WishlistIcon type="cart" className="h-6 w-6" />
                            <span>Add to Cart</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => wishlistStore.remove(item.wishlistKey || item)}
                            className="inline-flex h-12 items-center justify-center gap-3 rounded-[14px] bg-[#ece9e5] px-6 text-base font-bold text-[#b8742f] transition hover:bg-[#e4ddd5]"
                          >
                            <WishlistIcon type="trash" className="h-6 w-6" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex h-full flex-col items-start gap-4 lg:items-end">
                        <div className="text-left lg:text-right">
                          <div className="text-[1.85rem] font-black leading-none text-[#b8742f]">
                            {formatCurrency(Number(item?.price || 0))}
                          </div>
                          <div className="mt-1 text-sm text-slate-700">
                            {item.variantLabel ? "Variant" : "Product"}
                          </div>
                        </div>

                        <Link
                          href={item.slug ? `/product/${item.slug}` : "/products"}
                          className="mt-auto inline-flex h-12 items-center justify-center rounded-[14px] border border-black/10 bg-white px-6 text-base font-medium text-ink transition hover:bg-[#faf6f0]"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[24px] bg-[#e8e7e5] p-8 shadow-[0_16px_40px_rgba(16,32,26,0.08)]">
              <h2 className="text-lg font-black leading-tight tracking-tight text-black">
                Wishlist Summary
              </h2>

              <div className="mt-10 flex gap-2 items-center">
                <span className="text-[1.8rem] font-black text-[#b8742f]">{sortedItems.length}</span>
                <span className="mt-1 text-[1.2rem] font-medium text-slate-700">Items</span>
              </div>

              <div className="mt-8 rounded-[18px] bg-white/70 px-5 py-4">
                <div className="text-sm uppercase tracking-[0.18em] text-slate-500">Estimated value</div>
                <div className="mt-2 text-[2rem] font-black text-ink">{formatCurrency(totalValue)}</div>
              </div>

              <div className="mt-10 space-y-4">
                <button
                  type="button"
                  onClick={moveAllToCart}
                  className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-[16px] bg-[#b8742f] px-6 text-lg font-bold text-white transition hover:bg-[#9f6428]"
                >
                  <WishlistIcon type="cart" className="h-7 w-7" />
                  <span>Move All to Cart</span>
                </button>

                <Link
                  href="/products"
                  className="inline-flex h-14 w-full items-center justify-center rounded-[16px] bg-white px-6 text-lg font-medium text-ink transition hover:bg-[#faf6f0]"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
