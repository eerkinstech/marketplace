"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { ProductDetailTabs } from "@/components/product/ProductDetailTabs";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { formatCurrency, getDiscountPercent } from "@/lib/utils/storefront";
import { getImageSource } from "@/lib/utils/images";
import { wishlistStore } from "@/lib/utils/wishlist-store";
import { tokenStore } from "@/lib/auth/token-store";

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeProductOptions(product) {
  if (Array.isArray(product?.variants) && product.variants.length) {
    return product.variants
      .map((option) => ({
        name: String(option?.name || "").trim(),
        values: [...new Set((option?.values || []).map((value) => String(value || "").trim()).filter(Boolean))]
      }))
      .filter((option) => option.name && option.values.length);
  }

  const optionMap = new Map();
  (product?.variantCombinations || []).forEach((variant) => {
    const values = variant?.optionValues || variant?.variantValues || {};
    Object.entries(values).forEach(([name, value]) => {
      const normalizedName = String(name || "").trim();
      const normalizedValue = String(value || "").trim();
      if (!normalizedName || !normalizedValue) return;
      const currentValues = optionMap.get(normalizedName) || [];
      if (!currentValues.includes(normalizedValue)) currentValues.push(normalizedValue);
      optionMap.set(normalizedName, currentValues);
    });
  });

  return Array.from(optionMap.entries()).map(([name, values]) => ({ name, values }));
}

function normalizeVariantCombinations(product) {
  return (product?.variantCombinations || []).map((variant, index) => ({
    id: variant?._id || variant?.sku || `variant-${index}`,
    optionValues: variant?.optionValues || variant?.variantValues || {},
    sku: variant?.sku || "",
    price: Number(variant?.price ?? product?.price ?? 0),
    stock: Number(variant?.stock ?? 0),
    weight: Number(variant?.weight ?? 0),
    image: getImageSource(variant?.image)
  }));
}

function getInitialSelection(options, variants) {
  if (variants.length && Object.keys(variants[0].optionValues || {}).length) {
    return { ...variants[0].optionValues };
  }

  return options.reduce((selection, option) => {
    selection[option.name] = option.values[0] || "";
    return selection;
  }, {});
}

function matchesSelection(variant, selection) {
  const values = variant?.optionValues || {};
  return Object.entries(selection).every(([name, value]) => !value || values[name] === value);
}

function isExactVariantMatch(variant, selection, optionCount) {
  const values = variant?.optionValues || {};
  return Object.keys(values).length === optionCount && matchesSelection(variant, selection);
}

function buildGallery(product, selectedVariantImage) {
  const sources = [
    selectedVariantImage,
    getImageSource(product?.image),
    ...(product?.images || []).map(getImageSource)
  ].filter(Boolean);

  return sources.filter((image, index) => sources.indexOf(image) === index);
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
  return Array.from({ length: 5 }, (_, index) => {
    const filled = index + 1 <= Math.round(safeRating);
    return (
      <span key={`star-${index}`} className={filled ? "text-amber-500" : "text-slate-300"}>
        <i className={`${filled ? "fas" : "far"} fa-star`} />
      </span>
    );
  });
}

export default function ProductDetailClient({ product }) {
  const options = useMemo(() => normalizeProductOptions(product), [product]);
  const variants = useMemo(() => normalizeVariantCombinations(product), [product]);
  const reviews = Array.isArray(product?.reviews) ? product.reviews.filter((review) => review && (review.status === "approved" || review.isApproved === true)) : [];
  const [selectedOptions, setSelectedOptions] = useState(() => getInitialSelection(options, variants));
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setSelectedOptions(getInitialSelection(options, variants));
  }, [options, variants]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    return variants.find((variant) => isExactVariantMatch(variant, selectedOptions, options.length)) || null;
  }, [options.length, selectedOptions, variants]);

  const selectedPrice = selectedVariant?.price ?? Number(product?.price || 0);
  const selectedStock = selectedVariant?.stock ?? Number(product?.stock || 0);
  const selectedWeight = selectedVariant && Number(selectedVariant.weight || 0) > 0
    ? Number(selectedVariant.weight || 0)
    : Number(product?.weight || 0);
  const selectedSku = selectedVariant?.sku || product?.sku || "";
  const selectedVariantImage = selectedVariant?.image || "";
  const galleryImages = useMemo(() => buildGallery(product, selectedVariantImage), [product, selectedVariantImage]);
  const activeImage = selectedImage && galleryImages.includes(selectedImage) ? selectedImage : galleryImages[0] || "";
  const discount = getDiscountPercent({ ...product, price: selectedPrice });
  const shortDescription = product?.shortDescription || stripHtml(product?.description);
  const ratingAverage = Number(product?.ratingAverage ?? product?.rating ?? 0);
  const reviewCount = Number(product?.numReviews || product?.reviewCount || product?.ratingCount || reviews.length || 0);
  const categorySlug = product?.category?.slug || product?.categorySlug || "";
  const vendorStoreSlug = product?.vendor?.storeSlug || "";
  const wishlistItem = useMemo(() => ({
    _id: product?._id,
    productId: product?._id,
    slug: product?.slug,
    name: product?.name,
    price: selectedPrice,
    compareAtPrice: product?.compareAtPrice,
    images: activeImage ? [{ url: activeImage }] : product?.images || [],
    image: activeImage || product?.image || "",
    category: product?.category,
    categorySlug: product?.categorySlug,
    vendor: product?.vendor,
    ratingAverage,
    stock: selectedStock,
    variantId: selectedVariant?.id || "",
    variantSku: selectedSku,
    sku: selectedSku,
    optionValues: selectedVariant?.optionValues || selectedOptions,
    selectedOptions,
    variantLabel: Object.entries(selectedVariant?.optionValues || selectedOptions || {})
      .filter(([, value]) => value)
      .map(([name, value]) => `${name}: ${value}`)
      .join(" • ")
  }), [
    activeImage,
    product,
    ratingAverage,
    selectedOptions,
    selectedPrice,
    selectedSku,
    selectedStock,
    selectedVariant
  ]);
  useEffect(() => {
    if (!galleryImages.length) {
      setSelectedImage("");
      return;
    }

    if (!selectedImage || !galleryImages.includes(selectedImage)) {
      setSelectedImage(galleryImages[0]);
    }
  }, [galleryImages, selectedImage]);

  useEffect(() => {
    setQuantity(1);
    setCopied(false);
  }, [selectedVariant?.id, selectedSku]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncWishlist = () => setIsInWishlist(wishlistStore.has(wishlistItem));
    const syncAuth = () => setIsAuthenticated(Boolean(tokenStore.get()));

    syncWishlist();
    syncAuth();
    window.addEventListener("wishlist:updated", syncWishlist);
    window.addEventListener("auth:updated", syncAuth);

    return () => {
      window.removeEventListener("wishlist:updated", syncWishlist);
      window.removeEventListener("auth:updated", syncAuth);
    };
  }, [wishlistItem]);

  function handleOptionChange(optionName, value) {
    const nextSelection = {
      ...selectedOptions,
      [optionName]: value
    };

    const exactMatch = variants.find((variant) => isExactVariantMatch(variant, nextSelection, options.length));
    if (exactMatch) {
      setSelectedOptions(nextSelection);
      return;
    }

    const fallbackVariant = variants.find((variant) => variant.optionValues?.[optionName] === value && matchesSelection(variant, nextSelection));
    if (fallbackVariant) {
      setSelectedOptions({ ...fallbackVariant.optionValues });
      return;
    }

    setSelectedOptions(nextSelection);
  }

  async function handleShare() {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (!shareUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name,
          text: shortDescription,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {}
  }

  function handleWishlist(event) {
    const saved = wishlistStore.toggle(wishlistItem);
    setIsInWishlist(saved);

    if (saved && typeof window !== "undefined") {
      const sourceRect = event?.currentTarget?.getBoundingClientRect?.();
      if (sourceRect) {
        window.dispatchEvent(new CustomEvent("wishlist:add-animation", {
          detail: {
            sourceRect,
            quantity: 1
          }
        }));
      }
    }
  }

  return (
    <section className="page-section px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-8">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-ink">Products</Link>
          {categorySlug ? (
            <>
              <span>/</span>
              <Link href={`/category/${categorySlug}`} className="hover:text-ink">
                {product?.category?.name || categorySlug}
              </Link>
            </>
          ) : null}
          <span>/</span>
          <span className="font-medium text-ink">{product?.name}</span>
        </nav>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[28px] border border-black/8 bg-white/90 p-4 shadow-[0_16px_40px_rgba(16,32,26,0.06)] sm:p-5">
              <div className="grid gap-4 md:grid-cols-[88px_minmax(0,1fr)]">
                <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:grid md:auto-rows-[88px] md:overflow-visible">
                  {(galleryImages.length ? galleryImages : [""]).map((image, index) => {
                    const isActive = activeImage === image;
                    return (
                      <button
                        key={`${image || "empty"}-${index}`}
                        type="button"
                        onClick={() => image && setSelectedImage(image)}
                        className={`h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[20px] border bg-[#f6f1e8] ${isActive ? "border-[#c07a34]" : "border-black/8 hover:border-[#c07a34]/50"}`}
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={`${product?.name} thumbnail ${index + 1}`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No image</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="order-1 overflow-hidden rounded-[24px] border border-black/8 bg-[#f5efe5] md:order-2">
                  <div className="aspect-square w-full">
                    <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-[#efe7dc]">
                      {activeImage ? (
                        <img
                          src={activeImage}
                          alt={product?.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="text-sm text-slate-500">No product image available</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[28px] border border-black/8 bg-white/95 p-5 shadow-[0_16px_40px_rgba(16,32,26,0.06)] sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {product?.category?.name ? <span className="badge">{product.category.name}</span> : null}
              {discount ? <span className="badge bg-[#c07a34]/10 text-[#c07a34]">{discount}% off</span> : null}
            </div>

            {selectedSku ? <div className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">SKU: {selectedSku}</div> : null}
            <h1 className="mt-3 font-display text-[2rem] leading-[1.02] text-ink sm:text-[2.4rem]">{product?.name}</h1>

            <div className="mt-4 flex items-end gap-3">
              <div className="text-[2.15rem] font-black leading-none text-[#c07a34]">{formatCurrency(selectedPrice)}</div>
              {product?.compareAtPrice ? (
                <div className="text-base text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</div>
              ) : null}
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-1">{renderStars(ratingAverage)}</div>
              <span>{ratingAverage.toFixed(1)}</span>
              <span>({reviewCount})</span>
            </div>

          
            <div className="mt-5 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-4">
              <div className="text-sm font-semibold text-emerald-800">
                {selectedStock > 0 ? "In Stock and Ready to Dispatch" : "Currently out of stock"}
              </div>
              <div className="mt-1 text-xs text-emerald-700">
                {selectedStock > 0 ? "Available to order now." : "Please try another option if available."}
              </div>
            </div>

            {options.length ? (
              <div className="mt-5 grid gap-4">
                {options.map((option) => (
                  <div key={option.name}>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {option.name}
                    </label>
                    <select
                      value={selectedOptions[option.name] || ""}
                      onChange={(event) => handleOptionChange(option.name, event.target.value)}
                      className="field-input h-12 w-full rounded-[16px] border border-black/10 bg-white px-4 text-sm text-ink"
                    >
                      {option.values.map((value) => (
                        <option key={`${option.name}-${value}`} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-5 rounded-[20px] border border-black/8 bg-[#fcfaf7] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Summary</div>
              <div className="mt-3 grid gap-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Store</span>
                  {vendorStoreSlug ? (
                    <Link href={`/store/${vendorStoreSlug}`} className="text-right font-semibold text-ink hover:underline">
                      {product?.vendor?.storeName || "Marketplace Seller"}
                    </Link>
                  ) : (
                    <span className="text-right font-semibold text-ink">{product?.vendor?.storeName || "Marketplace Seller"}</span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Availability</span>
                  <span className="text-right font-semibold text-ink">{selectedStock > 0 ? "In stock" : "Out of stock"}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Weight</span>
                  <span className="text-right font-semibold text-ink">{selectedWeight > 0 ? `${selectedWeight} kg` : "Not set"}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-slate-500">Category</span>
                  <span className="text-right font-semibold text-ink">{product?.category?.name || "General"}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[112px_minmax(0,1fr)]">
              <div className="grid h-[56px] grid-cols-3 overflow-hidden rounded-[16px] border border-black/10 bg-white">
                <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="text-xl font-semibold text-ink hover:bg-[#f7f3ec]">-</button>
                <div className="flex items-center justify-center border-x border-black/10 text-lg font-semibold text-ink">{quantity}</div>
                <button type="button" onClick={() => setQuantity((current) => current + 1)} className="text-xl font-semibold text-ink hover:bg-[#f7f3ec]">+</button>
              </div>

              <AddToCartButton
                product={product}
                selectedVariant={selectedVariant}
                selectedImage={activeImage}
                disabled={selectedStock <= 0}
                quantity={quantity}
                className="h-[56px] w-full rounded-[16px] bg-[#c07a34] px-6 text-base font-bold hover:bg-[#a96b2d]"
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Link
                href={isAuthenticated ? "/checkout" : "/login"}
                className={`flex h-[48px] items-center justify-center rounded-[16px] text-sm font-bold ${selectedStock > 0 ? "bg-ink text-white hover:bg-black" : "pointer-events-none bg-slate-200 text-slate-500"}`}
              >
                {isAuthenticated ? "Buy now" : "Login to buy"}
              </Link>
              <button
                type="button"
                onClick={handleShare}
                className="h-[48px] rounded-[16px] border border-black/10 bg-white text-sm font-bold text-ink hover:bg-[#faf6f0]"
              >
                {copied ? "Link copied" : "Share product"}
              </button>
              <button
                type="button"
                onClick={handleWishlist}
                className={`h-[48px] rounded-[16px] border text-sm font-bold transition ${isInWishlist ? "border-[#c07a34] bg-[#fff4e8] text-[#c07a34]" : "border-black/10 bg-white text-ink hover:bg-[#faf6f0]"}`}
              >
                {isInWishlist ? "Saved variant" : "Save variant"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
              {vendorStoreSlug ? (
                <Link href={`/store/${vendorStoreSlug}`} className="hover:text-ink hover:underline">
                  {product?.vendor?.storeName || "Visit store"}
                </Link>
              ) : null}
              {vendorStoreSlug ? (
                <Link href={`/support?vendor=${vendorStoreSlug}`} className="hover:text-ink hover:underline">
                  Contact seller
                </Link>
              ) : null}
              <Link href="/wishlist" className="hover:text-ink hover:underline">Wishlist</Link>
              <Link href="/cart" className="hover:text-ink hover:underline">View cart</Link>
            </div>
          </aside>
        </div>

        <ProductDetailTabs product={product} />
        <RelatedProducts product={product} />
      </div>
    </section>
  );
}
