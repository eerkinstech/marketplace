"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { getImageSource } from "@/lib/utils/images";

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
    upload: <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0-4 4m4-4 4 4M5 18v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" />,
    download: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0 4-4m-4 4-4-4M5 18v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" />,
    add: <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10a2.12 2.12 0 1 0-3-3L5 17v3Z" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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

function getProductDisplayMetrics(product) {
  const variants = Array.isArray(product.variantCombinations) ? product.variantCombinations : [];

  if (!variants.length) {
    return {
      price: Number(product.price || 0),
      stock: Number(product.stock || 0),
      hasVariants: false
    };
  }

  const variantPrices = variants.map((variant) => Number(variant.price || product.price || 0));
  const totalVariantStock = variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);

  return {
    price: Math.min(...variantPrices),
    stock: totalVariantStock,
    hasVariants: true
  };
}

function getProductTableImage(product) {
  return (
    getImageSource(product?.images?.[0]) ||
    getImageSource(product?.image) ||
    getImageSource(product?.variantCombinations?.find((variant) => variant?.image)?.image) ||
    ""
  );
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"") {
      if (quoted && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function toCsvValue(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function parseList(value) {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  return String(value || "")
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseJsonField(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  const text = String(value || "").trim();
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function stringifyJsonField(value) {
  if (!value || (Array.isArray(value) && !value.length)) return "";
  return JSON.stringify(value);
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  const text = String(value || "").trim().toLowerCase();
  if (!text) return undefined;
  return ["1", "true", "yes", "active", "approved"].includes(text);
}

function normalizeHeader(value) {
  return String(value || "").trim();
}

function getRowValue(row, keys) {
  const wanted = keys.map((key) => String(key).toLowerCase());
  const match = Object.entries(row).find(([key]) => wanted.includes(String(key).toLowerCase()));
  return match?.[1] ?? "";
}

function getCategoryIdsFromRow(row, categories) {
  const rawValues = [
    getRowValue(row, ["categoryIds", "categories", "categorySlugs"]),
    getRowValue(row, ["categoryId", "categorySlug", "category", "categoryName"])
  ];
  const categoryMap = new Map();
  categories.forEach((category) => {
    [category._id, category.slug, category.name].filter(Boolean).forEach((value) => {
      categoryMap.set(String(value).trim().toLowerCase(), category._id);
    });
  });

  return Array.from(new Set(rawValues.flatMap(parseList)
    .map((value) => categoryMap.get(String(value).trim().toLowerCase()))
    .filter(Boolean)));
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildPayloadFromRow(row, categories, rowNumber) {
  const name = String(getRowValue(row, ["name"]) || "").trim();
  const description = String(getRowValue(row, ["description"]) || "").trim();
  const sku = String(getRowValue(row, ["sku"]) || "").trim();
  const categoryIds = getCategoryIdsFromRow(row, categories);

  if (!name || !description || !sku || !categoryIds.length) {
    throw new Error(`Import row ${rowNumber} is missing name, description, sku, or category.`);
  }

  const compareAtPrice = getRowValue(row, ["compareAtPrice"]);
  const merchant = {
    brand: String(getRowValue(row, ["brand", "merchant.brand"]) || "").trim(),
    gtin: String(getRowValue(row, ["gtin", "merchant.gtin"]) || "").trim(),
    mpn: String(getRowValue(row, ["mpn", "merchant.mpn"]) || "").trim(),
    googleProductCategory: String(getRowValue(row, ["googleProductCategory", "merchant.googleProductCategory"]) || "").trim(),
    condition: String(getRowValue(row, ["condition", "merchant.condition"]) || "new").trim() || "new",
    ageGroup: String(getRowValue(row, ["ageGroup", "merchant.ageGroup"]) || "").trim(),
    gender: String(getRowValue(row, ["gender", "merchant.gender"]) || "").trim(),
    color: String(getRowValue(row, ["color", "merchant.color"]) || "").trim(),
    size: String(getRowValue(row, ["size", "merchant.size"]) || "").trim(),
    material: String(getRowValue(row, ["material", "merchant.material"]) || "").trim(),
    pattern: String(getRowValue(row, ["pattern", "merchant.pattern"]) || "").trim()
  };

  return {
    name,
    slug: String(getRowValue(row, ["slug"]) || "").trim() || undefined,
    description,
    shortDescription: String(getRowValue(row, ["shortDescription"]) || "").trim() || description.slice(0, 180),
    price: Number(getRowValue(row, ["price"]) || 0),
    compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
    categoryId: categoryIds[0],
    categoryIds,
    stock: Number(getRowValue(row, ["stock"]) || 0),
    weight: Number(getRowValue(row, ["weight"]) || 0),
    sku,
    images: parseJsonField(getRowValue(row, ["images"]), []),
    variants: parseJsonField(getRowValue(row, ["variants"]), []),
    variantCombinations: parseJsonField(getRowValue(row, ["variantCombinations"]), []),
    benefitsHeading: String(getRowValue(row, ["benefitsHeading"]) || "").trim(),
    benefitsText: String(getRowValue(row, ["benefitsText"]) || "").trim(),
    tags: parseList(getRowValue(row, ["tags"])),
    merchant,
    shippingAreaIds: parseList(getRowValue(row, ["shippingAreaIds", "shippingAreas"])),
    isFeatured: parseBoolean(getRowValue(row, ["isFeatured"])),
    seo: {
      metaTitle: String(getRowValue(row, ["metaTitle", "seo.metaTitle"]) || name).trim(),
      metaDescription: String(getRowValue(row, ["metaDescription", "seo.metaDescription", "shortDescription"]) || description.slice(0, 160)).trim(),
      keywords: parseList(getRowValue(row, ["keywords", "seo.keywords", "tags"]))
    }
  };
}

function parseImportFile(text, filename, categories) {
  if (filename.toLowerCase().endsWith(".json")) {
    const rows = JSON.parse(text);
    if (!Array.isArray(rows)) throw new Error("JSON import must be an array of products.");
    return rows.map((row, index) => buildPayloadFromRow(row, categories, index + 1));
  }

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV import must include a header row and at least one product row.");

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = headers.reduce((accumulator, header, headerIndex) => {
      accumulator[header] = values[headerIndex] ?? "";
      return accumulator;
    }, {});
    return buildPayloadFromRow(row, categories, index + 2);
  });
}

export default function VendorProductsPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to manage products.");
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const fileInputRef = useRef(null);

  async function load() {
    if (!token) return;
    try {
      const response = await marketplaceApi.getVendorProducts(token);
      setProducts(response.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => products.some((product) => String(product._id) === String(id)))
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesTab = activeTab === "all" ? true : product.status === activeTab;
      const keyword = search.trim().toLowerCase();
      const matchesSearch = keyword
        ? [product.name, product.sku, product.category?.name, product.categorySlug]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword))
        : true;
      return matchesTab && matchesSearch;
    });
  }, [activeTab, products, search]);

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedIds.includes(String(product._id))),
    [products, selectedIds]
  );

  const statusTabs = useMemo(() => ([
    { id: "all", label: "All", count: products.length },
    { id: "approved", label: "Active", count: products.filter((product) => product.status === "approved").length },
    { id: "pending", label: "Pending", count: products.filter((product) => product.status === "pending").length },
    { id: "rejected", label: "Rejected", count: products.filter((product) => product.status === "rejected").length }
  ]), [products]);

  const allSelected = filteredProducts.length > 0 && filteredProducts.every((product) => selectedIds.includes(String(product._id)));

  function toggleRow(productId) {
    setSelectedIds((current) =>
      current.includes(String(productId))
        ? current.filter((entry) => entry !== String(productId))
        : [...current, String(productId)]
    );
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredProducts.some((product) => String(product._id) === String(id)))
      );
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...filteredProducts.map((product) => String(product._id))])));
  }

  async function removeProduct(id) {
    try {
      await marketplaceApi.deleteVendorProduct(token, id);
      setNotice("Product deleted.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function runBulkDelete() {
    if (!selectedProducts.length) {
      setError("Select at least one product first.");
      return;
    }

    try {
      setBusyAction("delete");
      await Promise.all(selectedProducts.map((product) => marketplaceApi.deleteVendorProduct(token, product._id)));
      setNotice(`${selectedProducts.length} products deleted.`);
      setSelectedIds([]);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyAction("");
    }
  }

  function exportProducts() {
    const rows = selectedProducts.length ? selectedProducts : products;
    const headers = [
      "id", "name", "slug", "description", "shortDescription", "price", "compareAtPrice", "stock", "weight", "sku",
      "categoryId", "categoryIds", "categorySlug", "categorySlugs", "categoryNames", "tags", "images", "variants",
      "variantCombinations", "benefitsHeading", "benefitsText", "brand", "gtin", "mpn", "googleProductCategory",
      "condition", "ageGroup", "gender", "color", "size", "material", "pattern", "shippingAreaIds", "shippingAreas",
      "metaTitle", "metaDescription", "keywords", "status", "rejectionReason", "ratingAverage", "ratingCount",
      "soldCount", "isFeatured", "createdAt", "updatedAt"
    ];
    const csv = [
      headers.join(","),
      ...rows.map((product) =>
        [
          product._id || "",
          product.name,
          product.slug || "",
          product.description || "",
          product.shortDescription || "",
          product.price ?? "",
          product.compareAtPrice ?? "",
          product.stock ?? 0,
          product.weight ?? 0,
          product.sku || "",
          product.category?._id || "",
          (product.categories || []).map((category) => category?._id || category).join("|"),
          product.category?.slug || product.categorySlug || "",
          (product.categorySlugs || []).join("|"),
          (product.categories || []).map((category) => category?.name || "").filter(Boolean).join("|"),
          (product.tags || []).join("|"),
          stringifyJsonField(product.images || []),
          stringifyJsonField(product.variants || []),
          stringifyJsonField(product.variantCombinations || []),
          product.benefitsHeading || "",
          product.benefitsText || "",
          product.merchant?.brand || "",
          product.merchant?.gtin || "",
          product.merchant?.mpn || "",
          product.merchant?.googleProductCategory || "",
          product.merchant?.condition || "new",
          product.merchant?.ageGroup || "",
          product.merchant?.gender || "",
          product.merchant?.color || "",
          product.merchant?.size || "",
          product.merchant?.material || "",
          product.merchant?.pattern || "",
          (product.shippingAreas || []).map((area) => area?._id || area).join("|"),
          (product.shippingAreas || []).map((area) => area?.name || area?.areaName || area?.label || "").filter(Boolean).join("|"),
          product.seo?.metaTitle || "",
          product.seo?.metaDescription || "",
          (product.seo?.keywords || []).join("|"),
          product.status || "",
          product.rejectionReason || "",
          product.ratingAverage ?? 0,
          product.ratingCount ?? 0,
          product.soldCount ?? 0,
          product.isFeatured ? "true" : "false",
          product.createdAt || "",
          product.updatedAt || ""
        ].map(toCsvValue).join(",")
      )
    ].join("\n");

    downloadFile("vendor-products-export.csv", csv, "text/csv;charset=utf-8");
    setNotice(`${rows.length} products exported.`);
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    try {
      setBusyAction("import");
      const [text, categoriesResponse] = await Promise.all([file.text(), marketplaceApi.getCategories()]);
      const payloads = parseImportFile(text, file.name, categoriesResponse.data || []);
      for (const payload of payloads) {
        await marketplaceApi.createVendorProduct(token, payload);
      }
      setNotice(`${payloads.length} products imported successfully.`);
      setSelectedIds([]);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setBusyAction("");
    }
  }

  return (
    <section className="container page-section stack">
      <div className="rounded-[28px] border border-[#cdd9d4] bg-[linear-gradient(180deg,#fbfffd_0%,#f2faf6_100%)] p-6 shadow-[0_24px_60px_rgba(15,118,110,0.08)] md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#0f766e]">Vendor Panel</div>
            <h1 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#1f2937] md:text-2xl">Product Management</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Review your catalog, import products, and keep stock under control with a cleaner workspace.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f766e] px-4 py-3 text-[13px] font-semibold text-white shadow-[0_10px_30px_rgba(15,118,110,0.24)] transition hover:-translate-y-0.5" type="button" onClick={() => fileInputRef.current?.click()} disabled={busyAction === "import"}>
              <Icon name="upload" className="h-4 w-4" />
              {busyAction === "import" ? "Importing..." : "Import Products"}
            </button>
            <Link className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1f2937] px-4 py-3 text-[13px] font-semibold text-white transition hover:-translate-y-0.5" href="/vendor/products/new"><Icon name="add" className="h-4 w-4" />Add Product</Link>
            <input ref={fileInputRef} type="file" accept=".csv,application/json" className="hidden" onChange={handleImport} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-[28px] border border-black/5 bg-white/85 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.06)] md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            {statusTabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${activeTab === tab.id ? "bg-[#1f2937] text-white shadow-[0_14px_28px_rgba(31,41,55,0.16)]" : "bg-[#edf5f1] text-slate-600 hover:bg-[#e2eee8]"}`}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 md:flex-row">

            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products by name or sku..." className="min-w-[280px] rounded-2xl border border-black/10 bg-[#fbfefd] px-4 py-3 text-[13px] outline-none transition focus:border-[#0f766e]" />
          </div>
        </div>

        {selectedProducts.length ? (
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={runBulkDelete} disabled={Boolean(busyAction)}><Icon name="trash" className="h-4 w-4" />Bulk delete</button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-[#b9d8ce] bg-[#f1fbf7] px-4 py-3 text-[13px] font-semibold text-[#0f766e] transition hover:bg-[#e2f6ee]" type="button" onClick={exportProducts}><Icon name="download" className="h-4 w-4" />Export</button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-700">{filteredProducts.length} products in view</div>
          <div className="text-xs text-slate-500">{selectedProducts.length} selected for action</div>
        </div>
      </div>

      {error ? <div className="card section small">{error}</div> : null}
      {notice ? <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="overflow-hidden rounded-[28px] border border-black/6 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-[linear-gradient(180deg,#eef8f4_0%,#e4f1eb_100%)]">
            <tr className="border-b border-black/10 text-slate-600">
              <th className="px-5 py-5 text-left"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <th className="px-5 py-5 text-left text-base font-semibold text-slate-900">Name</th>
              <th className="px-5 py-5 text-left text-base font-semibold text-slate-900">Price</th>
              <th className="px-5 py-5 text-left text-base font-semibold text-slate-900">Stock</th>
              <th className="px-5 py-5 text-left text-base font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const checked = selectedIds.includes(String(product._id));
              const displayMetrics = getProductDisplayMetrics(product);
              const productImage = getProductTableImage(product);
              return (
                <tr key={product._id} className="border-b border-[#e3ede8] align-top transition hover:bg-[#fbfefd] last:border-b-0">
                  <td className="px-5 py-6"><input type="checkbox" checked={checked} onChange={() => toggleRow(product._id)} /></td>
                  <td className="px-5 py-6 text-ink">
                    <div className="flex min-w-[340px] items-start gap-4">
                      <div className="flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#e7f5ef,#d9ede4)]">
                        {productImage ? <img src={productImage} alt={product.name} className="h-full w-full object-cover" /> : <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Item</span>}
                      </div>
                      <div className="space-y-2">
                        <div className="max-w-[420px] text-[18px] font-semibold leading-8 text-slate-950">{product.name}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${product.status === "approved" ? "bg-emerald-50 text-emerald-700" : product.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>{product.status}</span>
                          <span className="text-xs text-slate-500">{product.category?.name || product.categorySlug || "No category"}</span>
                          <span className="text-xs text-slate-500">SKU: {product.sku}</span>
                        </div>
                        {product.rejectionReason ? <div className="text-xs text-rose-700">{product.rejectionReason}</div> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-6 text-slate-900">
                    <div className="text-[18px] font-semibold">
                      {displayMetrics.hasVariants ? `From ${formatCurrency(displayMetrics.price)}` : formatCurrency(displayMetrics.price)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {displayMetrics.hasVariants ? "Lowest variant price" : "Storefront price"}
                    </div>
                  </td>
                  <td className="px-5 py-6 text-slate-900">
                    <div className="inline-flex min-w-20 items-center justify-center rounded-full bg-[#edf5f1] px-4 py-2 text-[18px] font-semibold text-[#0f766e]">{displayMetrics.stock}</div>
                    <div className="mt-2 text-xs text-slate-500">Total stock</div>
                  </td>
                  <td className="px-5 py-6">
                    <div className="flex flex-wrap gap-2">
                      <Link className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50" href={`/vendor/products/new?id=${product._id}`} title="Edit product"><Icon name="edit" /></Link>
                      <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100" type="button" onClick={() => removeProduct(product._id)} title="Delete product"><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filteredProducts.length ? (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center text-sm text-slate-500">No products match this filter yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
