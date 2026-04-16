"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";

function Icon({ name, className = "h-4 w-4" }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    className,
    "aria-hidden": true
  };

  const icons = {
    search: <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />,
    close: <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />,
    chevronRight: <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />,
    chevronDown: <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />,
    spinner: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m11.728 0-2.121 2.121M8.757 15.243l-2.121 2.121" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10a2.12 2.12 0 1 0-3-3L5 17v3Z" />
  };

  return <svg {...props}>{icons[name]}</svg>;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function hasVariants(product) {
  return Array.isArray(product.variantCombinations) && product.variantCombinations.length > 0;
}

function getTotalVariantStock(product) {
  if (!hasVariants(product)) return Number(product.stock || 0);
  return product.variantCombinations.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
}

function getLowestPrice(product) {
  if (!hasVariants(product)) return Number(product.price || 0);
  return Math.min(...product.variantCombinations.map((variant) => Number(variant.price || product.price || 0)));
}

function formatVariantValues(optionValues) {
  if (!optionValues) return "";
  return Object.entries(optionValues).map(([key, value]) => `${key}: ${value}`).join(" | ");
}

function buildPayload(product, overrides = {}) {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description || `${product.name} inventory item details and stock information.`,
    shortDescription: product.shortDescription || product.name,
    price: Number(overrides.price ?? product.price ?? 0),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
    categoryId: product.category?._id || product.category,
    stock: Number(overrides.stock ?? product.stock ?? 0),
    weight: Number(overrides.weight ?? product.weight ?? 0),
    sku: product.sku,
    variants: product.variants || [],
    variantCombinations: overrides.variantCombinations || (product.variantCombinations || []).map((variant) => ({
      optionValues: variant.optionValues || {},
      sku: variant.sku || "",
      price: Number(variant.price || 0),
      stock: Number(variant.stock || 0),
      weight: Number(variant.weight || 0),
      image: variant.image || ""
    })),
    benefitsHeading: product.benefitsHeading || "",
    benefitsText: product.benefitsText || "",
    tags: product.tags || [],
    seo: {
      metaTitle: product.seo?.metaTitle || "",
      metaDescription: product.seo?.metaDescription || "",
      keywords: product.seo?.keywords || []
    }
  };
}

export function InventoryManager({
  eyebrow,
  title,
  description,
  products,
  error,
  onSaveProduct,
  editHrefPrefix,
  ownerTabs = [],
  activeOwnerFilter = "",
  onOwnerFilterChange
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const [failedImages, setFailedImages] = useState(() => new Set());
  const [updatingFields, setUpdatingFields] = useState(() => new Set());
  const [editingVariants, setEditingVariants] = useState({});
  const [baseStockEdits, setBaseStockEdits] = useState({});

  const visibleProducts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return (products || []).filter((product) => {
      if (!keyword) return true;
      return [product.name, product.sku, product.category?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [products, searchQuery]);

  function toggleVariantExpand(productId) {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  async function saveBaseStock(product, value) {
    const fieldKey = `${product._id}-base-stock`;
    try {
      setUpdatingFields((current) => new Set([...current, fieldKey]));
      await onSaveProduct(product._id, buildPayload(product, { stock: Number(value || 0) }));
      setBaseStockEdits((current) => {
        const next = { ...current };
        delete next[product._id];
        return next;
      });
    } finally {
      setUpdatingFields((current) => {
        const next = new Set(current);
        next.delete(fieldKey);
        return next;
      });
    }
  }

  async function saveVariantField(product, variantIndex, field, value) {
    const fieldKey = `${product._id}-${field}-${variantIndex}`;
    try {
      setUpdatingFields((current) => new Set([...current, fieldKey]));
      const variantCombinations = (product.variantCombinations || []).map((variant, index) => ({
        optionValues: variant.optionValues || {},
        sku: variant.sku || "",
        price: Number(index === variantIndex && field === "price" ? value : variant.price || 0),
        stock: Number(index === variantIndex && field === "stock" ? value : variant.stock || 0),
        weight: Number(index === variantIndex && field === "weight" ? value : variant.weight || 0),
        image: variant.image || ""
      }));
      await onSaveProduct(product._id, buildPayload(product, { variantCombinations }));
      setEditingVariants((current) => {
        const next = { ...current };
        if (next[product._id]?.[variantIndex]) {
          next[product._id] = { ...next[product._id] };
          next[product._id][variantIndex] = { ...next[product._id][variantIndex] };
          delete next[product._id][variantIndex][field];
        }
        return next;
      });
    } finally {
      setUpdatingFields((current) => {
        const next = new Set(current);
        next.delete(fieldKey);
        return next;
      });
    }
  }

  return (
    <section className="container page-section stack">
      <div className="rounded-[28px] border border-black/8 bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f5_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{eyebrow}</div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-3xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
            {ownerTabs.length ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {ownerTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onOwnerFilterChange?.(tab.id)}
                    className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition ${activeOwnerFilter === tab.id ? "bg-[#2f3136] text-white shadow-[0_14px_28px_rgba(47,49,54,0.18)]" : "bg-[#f4efe8] text-slate-600 hover:bg-[#ede4d7]"}`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Icon name="search" />
            </div>
            <input
              type="text"
              placeholder="Search products by name, sku, category..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-[22px] border border-black/10 bg-white px-12 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-slate-700"
                aria-label="Clear search"
              >
                <Icon name="close" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <div className="card section small">{error}</div> : null}

      <div className="overflow-hidden rounded-[28px] border border-black/6 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-[linear-gradient(180deg,#f7f7f5_0%,#efeee9_100%)]">
            <tr className="border-b border-black/10">
              <th className="w-16 px-4 py-4 text-left"></th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900">Product Name</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-900">SKU</th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-slate-900">Price</th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-slate-900">Stock</th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-slate-900">Variants</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.length ? visibleProducts.map((product) => {
              const expanded = expandedRows.has(product._id);
              const productHasVariants = hasVariants(product);
              const baseFieldKey = `${product._id}-base-stock`;
              const baseValue = baseStockEdits[product._id] !== undefined ? baseStockEdits[product._id] : Number(product.stock || 0);
              const baseChanged = Number(baseValue) !== Number(product.stock || 0);
              const imageUrl = product.images?.[0]?.url || "";

              return (
                <Fragment key={product._id}>
                  <tr className="border-b border-black/6 align-middle transition hover:bg-[#fafaf8]">
                    <td className="px-4 py-5 align-middle">
                      <div className="flex items-center justify-center">
                        {productHasVariants ? (
                          <button
                            type="button"
                            onClick={() => toggleVariantExpand(product._id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            title={expanded ? "Collapse variants" : "Expand variants"}
                          >
                            <Icon name={expanded ? "chevronDown" : "chevronRight"} className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="inline-flex h-8 w-8" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        {imageUrl && !failedImages.has(product._id) ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-14 w-14 rounded-xl object-cover"
                            onError={() => setFailedImages((current) => new Set([...current, product._id]))}
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">No image</div>
                        )}
                        <div>
                          <div className="max-w-[360px] text-[15px] font-semibold leading-6 text-slate-950">{product.name}</div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                            {product.vendorLabel ? <span>{product.vendorLabel}</span> : null}

                            <span className={`rounded-full px-2 py-0.5 font-semibold ${product.status === "approved" ? "bg-emerald-50 text-emerald-700" : product.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                              {product.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-[13px] text-slate-600">{product.sku || "-"}</td>
                    <td className="px-4 py-5 text-center text-[13px] font-semibold text-slate-950">
                      {productHasVariants ? (
                        <div className="leading-6">
                          <div>From</div>
                          <div className="text-[15px]">{formatCurrency(getLowestPrice(product))}</div>
                        </div>
                      ) : (
                        <div className="text-[15px]">{formatCurrency(product.price)}</div>
                      )}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {productHasVariants ? (
                          <span className={`rounded-full px-4 py-1.5 text-[15px] font-semibold ${getTotalVariantStock(product) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {getTotalVariantStock(product)}
                          </span>
                        ) : (
                          <>
                            <input
                              type="number"
                              min="0"
                              value={baseValue}
                              disabled={updatingFields.has(baseFieldKey)}
                              onChange={(event) => setBaseStockEdits((current) => ({ ...current, [product._id]: event.target.value }))}
                              className={`w-20 rounded-xl border px-3 py-2 text-center text-[13px] outline-none transition ${baseChanged ? "border-amber-400 bg-amber-50" : "border-black/10 bg-white"} ${updatingFields.has(baseFieldKey) ? "cursor-not-allowed opacity-70" : ""}`}
                            />
                            {updatingFields.has(baseFieldKey) ? <Icon name="spinner" className="h-4 w-4 animate-spin text-slate-500" /> : null}
                            {baseChanged && !updatingFields.has(baseFieldKey) ? (
                              <button
                                type="button"
                                onClick={() => saveBaseStock(product, baseValue)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700"
                                title="Save stock"
                              >
                                <Icon name="check" />
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                      {productHasVariants ? (
                        <span className="inline-flex min-w-20 justify-center rounded-full bg-sky-100 px-3 py-1.5 text-[13px] font-semibold text-sky-700">
                          {product.variantCombinations.length} var
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                  </tr>
                  {expanded && productHasVariants ? (
                    <tr className="border-b border-black/6 bg-[#f8fbff]">
                      <td className="px-4 py-3"></td>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                          <table className="min-w-full border-collapse text-sm">
                            <thead className="bg-[#f7f5f1]">
                              <tr className="border-b border-slate-200">
                                <th className="px-5 py-3 text-left text-sm font-semibold text-slate-600">Variant Details</th>
                                <th className="px-5 py-3 text-left text-sm font-semibold text-slate-600">SKU</th>
                                <th className="px-5 py-3 text-center text-sm font-semibold text-slate-600">Price</th>
                                <th className="px-5 py-3 text-center text-sm font-semibold text-slate-600">Stock</th>
                              </tr>
                            </thead>
                            <tbody>
                              {product.variantCombinations.map((variant, index) => {
                                const priceFieldKey = `${product._id}-price-${index}`;
                                const stockFieldKey = `${product._id}-stock-${index}`;
                                const edits = editingVariants[product._id]?.[index] || {};
                                const displayPrice = edits.price !== undefined ? edits.price : Number(variant.price || 0);
                                const displayStock = edits.stock !== undefined ? edits.stock : Number(variant.stock || 0);
                                const priceChanged = Number(displayPrice) !== Number(variant.price || 0);
                                const stockChanged = Number(displayStock) !== Number(variant.stock || 0);

                                return (
                                  <tr key={`${product._id}-variant-${index}`} className="border-b border-slate-100 last:border-b-0">
                                    <td className="px-5 py-4 text-[14px] text-slate-900">{formatVariantValues(variant.optionValues) || "Default"}</td>
                                    <td className="px-5 py-4 text-[14px] text-slate-600">{variant.sku || "-"}</td>
                                    <td className="px-5 py-4">
                                      <div className="flex items-center justify-center gap-2">
                                        <span className="text-[15px] text-slate-500">$</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={displayPrice}
                                          disabled={updatingFields.has(priceFieldKey)}
                                          onChange={(event) =>
                                            setEditingVariants((current) => ({
                                              ...current,
                                              [product._id]: {
                                                ...(current[product._id] || {}),
                                                [index]: {
                                                  ...(current[product._id]?.[index] || {}),
                                                  price: event.target.value
                                                }
                                              }
                                            }))
                                          }
                                          className={`w-28 rounded-xl border px-3 py-2 text-right text-[14px] outline-none transition ${priceChanged ? "border-amber-400 bg-amber-50" : "border-black/10 bg-white"} ${updatingFields.has(priceFieldKey) ? "cursor-not-allowed opacity-70" : ""}`}
                                        />
                                        {updatingFields.has(priceFieldKey) ? <Icon name="spinner" className="h-4 w-4 animate-spin text-slate-500" /> : null}
                                        {priceChanged && !updatingFields.has(priceFieldKey) ? (
                                          <button
                                            type="button"
                                            onClick={() => saveVariantField(product, index, "price", displayPrice)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700"
                                            title="Save price"
                                          >
                                            <Icon name="check" />
                                          </button>
                                        ) : null}
                                      </div>
                                    </td>
                                    <td className="px-5 py-4">
                                      <div className="flex items-center justify-center gap-2">
                                        <input
                                          type="number"
                                          min="0"
                                          value={displayStock}
                                          disabled={updatingFields.has(stockFieldKey)}
                                          onChange={(event) =>
                                            setEditingVariants((current) => ({
                                              ...current,
                                              [product._id]: {
                                                ...(current[product._id] || {}),
                                                [index]: {
                                                  ...(current[product._id]?.[index] || {}),
                                                  stock: event.target.value
                                                }
                                              }
                                            }))
                                          }
                                          className={`w-24 rounded-xl border px-3 py-2 text-center text-[14px] outline-none transition ${stockChanged ? "border-amber-400 bg-amber-50" : "border-black/10 bg-white"} ${updatingFields.has(stockFieldKey) ? "cursor-not-allowed opacity-70" : ""}`}
                                        />
                                        <span className={`rounded-xl px-2.5 py-1 text-[13px] font-semibold ${Number(displayStock) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                          {displayStock}
                                        </span>
                                        {updatingFields.has(stockFieldKey) ? <Icon name="spinner" className="h-4 w-4 animate-spin text-slate-500" /> : null}
                                        {stockChanged && !updatingFields.has(stockFieldKey) ? (
                                          <button
                                            type="button"
                                            onClick={() => saveVariantField(product, index, "stock", displayStock)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700"
                                            title="Save stock"
                                          >
                                            <Icon name="check" />
                                          </button>
                                        ) : null}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            }) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
