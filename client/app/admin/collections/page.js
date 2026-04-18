"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const HOME_TABS = [
  {
    slug: "home-popular-categories",
    label: "Popular Categories",
    sectionType: "category_strip",
    order: 10,
    fields: ["title"],
    categoryMode: "categories"
  },
  {
    slug: "home-recommended-products",
    label: "Recommended Products",
    sectionType: "product_carousel",
    order: 20,
    fields: ["title", "button", "product_settings"],
    productMode: "products"
  },
  {
    slug: "home-three-col-category",
    label: "Three Col Category",
    sectionType: "three_col_category",
    order: 30,
    fields: [],
    categoryMode: "categories",
    customLayout: "three_col_category"
  },
  {
    slug: "home-mid-product-carousel",
    label: "Middle Product Carousel",
    sectionType: "product_carousel",
    order: 35,
    fields: ["title", "description", "button", "product_settings"],
    productMode: "products"
  },
  {
    slug: "home-image-banner-1",
    label: "Banner One",
    sectionType: "image_banner",
    order: 40,
    fields: [],
    imageMode: true
  },
  {
    slug: "home-trending-products",
    label: "Trending Products",
    sectionType: "product_carousel",
    order: 50,
    fields: ["title", "button", "product_settings"],
    productMode: "products"
  },
  {
    slug: "home-category-mosaic",
    label: "Category Mosaic",
    sectionType: "category_mosaic",
    order: 60,
    fields: ["title", "description"],
    categoryMode: "categories"
  },
  {
    slug: "home-latest-market-picks",
    label: "Latest Market Picks",
    sectionType: "product_carousel",
    order: 70,
    fields: ["title", "button", "product_settings"],
    productMode: "products"
  },
  {
    slug: "home-promo-showcase",
    label: "Promo Showcase",
    sectionType: "promo_showcase",
    order: 80,
    fields: [],
    categoryMode: "categories",
    customLayout: "promo_showcase"
  },
  {
    slug: "home-curated-essentials",
    label: "Curated Essentials",
    sectionType: "product_carousel",
    order: 90,
    fields: ["title", "button", "product_settings"],
    productMode: "products"
  },
  {
    slug: "home-image-banner-2",
    label: "Banner Two",
    sectionType: "image_banner",
    order: 100,
    fields: [],
    imageMode: true
  }
];

function normalizeCollection(response) {
  const rows = response?.data || response || [];
  return Array.isArray(rows) ? rows : [];
}

function normalizeProducts(response) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function generateSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function createEmptyItem() {
  return {
    eyebrow: "",
    title: "",
    subtitle: "",
    description: "",
    label: "",
    href: "",
    imageUrl: "",
    mobileImageUrl: "",
    backgroundColor: "",
    textColor: "",
    accentColor: "",
    badge: ""
  };
}

function createSectionFromTab(tab) {
  const base = {
    _id: `draft-${tab.slug}`,
    isDraft: true,
    name: tab.label,
    slug: tab.slug,
    sectionType: tab.sectionType,
    order: tab.order,
    isActive: true,
    eyebrow: "",
    title: tab.label,
    subtitle: "",
    description: "",
    ctaLabel: "",
    ctaHref: "",
    theme: "light",
    backgroundColor: "",
    textColor: "",
    accentColor: "",
    imageUrl: "",
    mobileImageUrl: "",
    limit: 8,
    sourceMode: tab.productMode ? "all" : "all",
    categoryIds: [],
    vendorIds: [],
    productIds: [],
    items: []
  };

  if (tab.customLayout === "three_col_category") {
    return {
      ...base,
      centerTitle: "Discover Categories",
      items: [
        { ...createEmptyItem(), title: "Browse category" },
        { ...createEmptyItem(), title: "Find the right Product" }
      ]
    };
  }

  if (tab.customLayout === "promo_showcase") {
    return {
      ...base,
      items: [
        { ...createEmptyItem(), title: "Ready for an upgrade?" },
        { ...createEmptyItem(), title: "Self care" }
      ]
    };
  }

  return base;
}

function mapSectionsToTabs(sections) {
  const map = new Map(sections.map((section) => [section.slug, section]));
  return HOME_TABS.map((tab) => {
    const existing = map.get(tab.slug);
    return existing ? { ...existing, isDraft: false } : createSectionFromTab(tab);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result || ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file?.name || "image"}`));
    reader.readAsDataURL(file);
  });
}

function Field({ label, children, hint }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0a5a46] ${props.className || ""}`}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0a5a46] ${props.className || ""}`}
    />
  );
}

function SelectList({ title, items, selectedIds, onToggle, getLabel, emptyMessage, search, onSearch }) {
  return (
    <div className="grid min-w-0 gap-3 rounded-[24px] border border-black/8 bg-[#fcfaf7] p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <TextInput value={search} onChange={(event) => onSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} />
      <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1">
        {!items.length ? <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">{emptyMessage}</div> : null}
        {items.map((item) => {
          const checked = selectedIds.includes(String(item._id));
          return (
            <label
              key={item._id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${checked ? "border-[#0a5a46] bg-[#edf7f2]" : "border-black/8 bg-white hover:bg-[#f8f5f1]"}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(String(item._id))}
                className="mt-1 h-4 w-4 rounded border-black/20"
              />
              <div className="min-w-0">
                <div className="font-semibold text-slate-900">{getLabel(item)}</div>
                {item.slug ? <div className="truncate text-xs text-slate-500">/{item.slug}</div> : null}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function UploadField({ value, onChange, onUpload, uploading }) {
  const inputRef = useRef(null);

  return (
    <div className="grid gap-3">
      <TextInput value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="Image URL" />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-2xl border border-black/10 bg-[#faf7f2] px-4 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
          >
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

export default function AdminCollectionsPage() {
  const { token, error: authError, setError: setAuthError } = useAccessToken(
    "Login with an admin account to manage homepage sections."
  );

  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [activeSlug, setActiveSlug] = useState(HOME_TABS[0].slug);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function loadPage() {
      try {
        setLoading(true);
        const [sectionsResponse, productsResponse, categoriesResponse, vendorsResponse] = await Promise.all([
          marketplaceApi.getAdminHomeSections(token),
          marketplaceApi.getAdminProducts(token),
          marketplaceApi.getAdminCategories(token),
          marketplaceApi.getAdminVendors(token)
        ]);

        const nextSections = mapSectionsToTabs(normalizeCollection(sectionsResponse));
        const nextProducts = normalizeProducts(productsResponse);
        const nextCategories = normalizeCollection(categoriesResponse?.data || categoriesResponse);
        const nextVendors = normalizeCollection(vendorsResponse?.data || vendorsResponse);

        setSections(nextSections);
        setProducts(nextProducts);
        setCategories(nextCategories);
        setVendors(nextVendors);
        setPageError("");
      } catch (error) {
        const message = error?.message || "Failed to load homepage editor";
        setPageError(message);
        setAuthError(message);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [token, setAuthError]);

  const activeSection = useMemo(
    () => sections.find((section) => section.slug === activeSlug) || null,
    [sections, activeSlug]
  );

  const activeTab = useMemo(
    () => HOME_TABS.find((tab) => tab.slug === activeSlug) || HOME_TABS[0],
    [activeSlug]
  );

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    const sourceMode = activeSection?.sourceMode || "all";

    const scopedProducts = products.filter((product) => {
      const productCategoryId = String(product?.category?._id || product?.category || "");
      const productVendorId = String(product?.vendor?._id || product?.vendor || "");

      if (sourceMode === "category") {
        const selectedCategoryIds = (activeSection?.categoryIds || []).map(String);
        if (!selectedCategoryIds.length) return false;
        return selectedCategoryIds.includes(productCategoryId);
      }

      if (sourceMode === "vendor") {
        const selectedVendorIds = (activeSection?.vendorIds || []).map(String);
        if (!selectedVendorIds.length) return false;
        return selectedVendorIds.includes(productVendorId);
      }

      return true;
    });

    if (!term) return scopedProducts;
    return scopedProducts.filter((product) =>
      [product.name, product.slug].filter(Boolean).some((value) => value.toLowerCase().includes(term))
    );
  }, [products, productSearch, activeSection]);

  const filteredCategories = useMemo(() => {
    const term = categorySearch.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) =>
      [category.name, category.slug].filter(Boolean).some((value) => value.toLowerCase().includes(term))
    );
  }, [categories, categorySearch]);

  const filteredVendors = useMemo(() => {
    const term = vendorSearch.trim().toLowerCase();
    if (!term) return vendors;
    return vendors.filter((vendor) =>
      [vendor.storeName, vendor.storeSlug, vendor.name, vendor.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [vendors, vendorSearch]);

  function updateActiveSection(patch) {
    if (!activeSection) return;
    setSections((current) =>
      current.map((section) => (section.slug === activeSection.slug ? { ...section, ...patch } : section))
    );
  }

  function updateItem(index, patch) {
    if (!activeSection) return;
    const nextItems = [...(activeSection.items || [])];
    nextItems[index] = { ...(nextItems[index] || createEmptyItem()), ...patch };
    updateActiveSection({ items: nextItems });
  }

  function toggleRelation(field, id) {
    if (!activeSection) return;
    const currentIds = Array.isArray(activeSection[field]) ? activeSection[field].map(String) : [];
    const nextIds = currentIds.includes(id) ? currentIds.filter((value) => value !== id) : [...currentIds, id];
    updateActiveSection({ [field]: nextIds });
  }

  async function uploadImage(file, assign) {
    if (!token || !file) return;

    try {
      setUploading(true);
      setPageError("");
      const image = await fileToDataUrl(file);
      const response = await marketplaceApi.createAdminMedia(token, { images: [image] });
      const uploaded = Array.isArray(response?.data) ? response.data[0] : response?.data?.[0];
      if (!uploaded?.url) throw new Error("Image upload failed");
      assign(uploaded.url);
      setNotice("Image uploaded.");
    } catch (error) {
      setPageError(error?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function saveSection() {
    if (!token || !activeSection) return;

    const payload = {
      name: activeSection.name || activeTab.label,
      slug: activeSection.slug || generateSlug(activeTab.label),
      sectionType: activeSection.sectionType || activeTab.sectionType,
      order: activeTab.order,
      isActive: Boolean(activeSection.isActive),
      title: activeSection.title || "",
      subtitle: activeSection.subtitle || "",
      description: activeSection.description || "",
      ctaLabel: activeSection.ctaLabel || "",
      ctaHref: activeSection.ctaHref || "",
      imageUrl: activeSection.imageUrl || "",
      mobileImageUrl: activeSection.mobileImageUrl || "",
      limit: Number(activeSection.limit || 8),
      sourceMode: activeSection.sourceMode || "all",
      categoryIds: (activeSection.categoryIds || []).map(String),
      vendorIds: (activeSection.vendorIds || []).map(String),
      productIds: (activeSection.productIds || []).map(String),
      items: (activeSection.items || []).map((item) => ({
        title: item.title || "",
        description: item.description || "",
        label: item.label || "",
        href: item.href || "",
        imageUrl: item.imageUrl || "",
        mobileImageUrl: item.mobileImageUrl || ""
      }))
    };

    if (activeTab.productMode) {
      const sourceMode = activeSection.sourceMode || "all";
      payload.sourceMode = sourceMode;

      if (sourceMode === "all") {
        payload.categoryIds = [];
        payload.vendorIds = [];
      } else if (sourceMode === "category") {
        payload.vendorIds = [];
      } else if (sourceMode === "vendor") {
        payload.categoryIds = [];
      }
    }

    if (activeTab.customLayout === "three_col_category") {
      payload.title = activeSection.centerTitle || "Discover Categories";
      payload.items = [
        {
          title: activeSection.items?.[0]?.title || "",
          description: activeSection.items?.[0]?.description || "",
          label: activeSection.items?.[0]?.label || "",
          href: activeSection.items?.[0]?.href || ""
        },
        {
          title: activeSection.items?.[1]?.title || "",
          description: activeSection.items?.[1]?.description || "",
          label: activeSection.items?.[1]?.label || "",
          href: activeSection.items?.[1]?.href || ""
        }
      ];
    }

    if (activeTab.customLayout === "promo_showcase") {
      payload.items = [
        { title: activeSection.items?.[0]?.title || "" },
        { title: activeSection.items?.[1]?.title || "" }
      ];
    }

    try {
      setSaving(true);
      setPageError("");

      const response = activeSection.isDraft
        ? await marketplaceApi.createAdminHomeSection(token, payload)
        : await marketplaceApi.updateAdminHomeSection(token, activeSection._id, payload);

      const saved = { ...(response?.data || response), isDraft: false };
      setSections((current) =>
        current.map((section) => (section.slug === activeSection.slug ? saved : section))
      );
      setNotice(`Saved "${activeTab.label}".`);
    } catch (error) {
      setPageError(error?.message || "Failed to save section");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="container page-section stack">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9a6b36]">Admin Panel</div>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-900">Home Page</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Edit homepage section data only. Design, colors, and layout stay fixed in code. Use each tab to choose headings, descriptions, buttons, categories, products, or banner images.
          </p>
        </div>
      </div>

      {authError ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{authError}</div> : null}
      {pageError ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{pageError}</div> : null}
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{notice}</div> : null}

      <div className="overflow-hidden rounded-[30px] border border-black/6 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-black/6 p-4">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
            {HOME_TABS.map((tab, index) => {
              const isActive = tab.slug === activeSlug;
              const section = sections.find((entry) => entry.slug === tab.slug);
              return (
                <button
                  key={tab.slug}
                  type="button"
                  onClick={() => setActiveSlug(tab.slug)}
                  className={`min-w-[160px] shrink-0 rounded-[22px] border px-4 py-3 text-left transition sm:min-w-[190px] ${isActive ? "border-[#0a5a46] bg-[#edf7f2]" : "border-black/8 bg-[#faf7f2] hover:bg-[#f4efe8]"}`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Section {index + 1}</div>
                  <div className="mt-2 text-base font-black text-slate-900">{tab.label}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {section?.isDraft ? "Not saved yet" : section?.isActive ? "Active" : "Hidden"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-slate-500">Loading homepage sections...</div>
        ) : activeSection ? (
          <div className="grid min-w-0 gap-6 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-slate-900">{activeTab.label}</h2>
                <p className="mt-1 text-sm text-slate-500">Only the content fields used by this section are shown here.</p>
              </div>

              <label className="inline-flex items-center gap-3 rounded-2xl border border-black/8 bg-[#faf7f2] px-4 py-3 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(activeSection.isActive)}
                  onChange={(event) => updateActiveSection({ isActive: event.target.checked })}
                  className="h-4 w-4 rounded border-black/20"
                />
                Show Section
              </label>
            </div>

            {activeTab.fields.includes("title") || activeTab.fields.includes("description") || activeTab.fields.includes("button") ? (
              <div className="grid min-w-0 gap-5 lg:grid-cols-2">
                {activeTab.fields.includes("title") ? (
                  <Field label="Heading">
                    <TextInput value={activeSection.title || ""} onChange={(event) => updateActiveSection({ title: event.target.value })} />
                  </Field>
                ) : null}

                {activeTab.fields.includes("description") ? (
                  <Field label="Description">
                    <TextArea rows={4} value={activeSection.description || activeSection.subtitle || ""} onChange={(event) => updateActiveSection({ description: event.target.value, subtitle: event.target.value })} />
                  </Field>
                ) : null}

                {activeTab.fields.includes("button") ? (
                  <>
                    <Field label="Button Label">
                      <TextInput value={activeSection.ctaLabel || ""} onChange={(event) => updateActiveSection({ ctaLabel: event.target.value })} />
                    </Field>
                    <Field label="Button Link">
                      <TextInput value={activeSection.ctaHref || ""} onChange={(event) => updateActiveSection({ ctaHref: event.target.value })} placeholder="/products" />
                    </Field>
                  </>
                ) : null}

                {activeTab.fields.includes("product_settings") ? (
                  <>
                    <Field label="Display Type">
                      <select
                        value={activeSection.sectionType || "product_carousel"}
                        onChange={(event) => updateActiveSection({ sectionType: event.target.value })}
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0a5a46]"
                      >
                        <option value="product_carousel">Carousel</option>
                        <option value="product_grid">Grid</option>
                      </select>
                    </Field>
                    <Field label="Products Limit">
                      <TextInput
                        type="number"
                        min="1"
                        max="24"
                        value={activeSection.limit ?? 8}
                        onChange={(event) => updateActiveSection({ limit: Number(event.target.value || 8) })}
                      />
                    </Field>
                  </>
                ) : null}
              </div>
            ) : null}

            {activeTab.customLayout === "three_col_category" ? (
              <div className="grid min-w-0 gap-5">
                <Field label="Center Heading">
                  <TextInput value={activeSection.centerTitle || activeSection.title || ""} onChange={(event) => updateActiveSection({ centerTitle: event.target.value, title: event.target.value })} />
                </Field>

                <div className="grid min-w-0 gap-5 lg:grid-cols-2">
                  <div className="grid min-w-0 gap-4 rounded-[24px] border border-black/8 bg-[#fcfaf7] p-4">
                    <div className="text-base font-black text-slate-900">Left Content</div>
                    <Field label="Heading">
                      <TextInput value={activeSection.items?.[0]?.title || ""} onChange={(event) => updateItem(0, { title: event.target.value })} />
                    </Field>
                    <Field label="Description">
                      <TextArea rows={4} value={activeSection.items?.[0]?.description || ""} onChange={(event) => updateItem(0, { description: event.target.value })} />
                    </Field>
                    <Field label="Button Label">
                      <TextInput value={activeSection.items?.[0]?.label || ""} onChange={(event) => updateItem(0, { label: event.target.value })} />
                    </Field>
                    <Field label="Button Link">
                      <TextInput value={activeSection.items?.[0]?.href || ""} onChange={(event) => updateItem(0, { href: event.target.value })} />
                    </Field>
                  </div>

                  <div className="grid min-w-0 gap-4 rounded-[24px] border border-black/8 bg-[#fcfaf7] p-4">
                    <div className="text-base font-black text-slate-900">Right Content</div>
                    <Field label="Heading">
                      <TextInput value={activeSection.items?.[1]?.title || ""} onChange={(event) => updateItem(1, { title: event.target.value })} />
                    </Field>
                    <Field label="Description">
                      <TextArea rows={4} value={activeSection.items?.[1]?.description || ""} onChange={(event) => updateItem(1, { description: event.target.value })} />
                    </Field>
                    <Field label="Button Label">
                      <TextInput value={activeSection.items?.[1]?.label || ""} onChange={(event) => updateItem(1, { label: event.target.value })} />
                    </Field>
                    <Field label="Button Link">
                      <TextInput value={activeSection.items?.[1]?.href || ""} onChange={(event) => updateItem(1, { href: event.target.value })} />
                    </Field>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab.customLayout === "promo_showcase" ? (
              <div className="grid min-w-0 gap-5 lg:grid-cols-2">
                <Field label="Left Heading">
                  <TextInput value={activeSection.items?.[0]?.title || ""} onChange={(event) => updateItem(0, { title: event.target.value })} />
                </Field>
                <Field label="Right Heading">
                  <TextInput value={activeSection.items?.[1]?.title || ""} onChange={(event) => updateItem(1, { title: event.target.value })} />
                </Field>
              </div>
            ) : null}

            {activeTab.productMode ? (
              <div className="grid gap-5">
                <div className="grid gap-3 rounded-[24px] border border-black/8 bg-[#fcfaf7] p-4">
                  <div className="text-sm font-semibold text-slate-900">Product Source</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "All Products" },
                      { value: "category", label: "By Category" },
                      { value: "vendor", label: "By Vendor" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateActiveSection({ sourceMode: option.value, productIds: [] })}
                        className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${((activeSection.sourceMode || "all") === option.value)
                          ? "border-[#0a5a46] bg-[#edf7f2] text-[#0a5a46]"
                          : "border-black/10 bg-white text-slate-700 hover:bg-[#f8f5f1]"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(activeSection.sourceMode || "all") === "category" ? (
                  <SelectList
                    title="Category Selection"
                    items={filteredCategories}
                    selectedIds={(activeSection.categoryIds || []).map(String)}
                    onToggle={(id) => toggleRelation("categoryIds", id)}
                    getLabel={(category) => category.name || "Unnamed category"}
                    emptyMessage="No categories found."
                    search={categorySearch}
                    onSearch={setCategorySearch}
                  />
                ) : null}

                {(activeSection.sourceMode || "all") === "vendor" ? (
                  <SelectList
                    title="Vendor Selection"
                    items={filteredVendors}
                    selectedIds={(activeSection.vendorIds || []).map(String)}
                    onToggle={(id) => toggleRelation("vendorIds", id)}
                    getLabel={(vendor) => vendor.storeName || vendor.name || vendor.email || "Unnamed vendor"}
                    emptyMessage="No vendors found."
                    search={vendorSearch}
                    onSearch={setVendorSearch}
                  />
                ) : null}

                <SelectList
                  title={
                    (activeSection.sourceMode || "all") === "all"
                      ? "All Products Selection"
                      : (activeSection.sourceMode || "all") === "category"
                        ? "Products From Selected Categories"
                        : "Products From Selected Vendors"
                  }
                  items={filteredProducts}
                  selectedIds={(activeSection.productIds || []).map(String)}
                  onToggle={(id) => toggleRelation("productIds", id)}
                  getLabel={(product) => product.name || "Unnamed product"}
                  emptyMessage={
                    (activeSection.sourceMode || "all") === "category"
                      ? "Select one or more categories first."
                      : (activeSection.sourceMode || "all") === "vendor"
                        ? "Select one or more vendors first."
                        : "No products found."
                  }
                  search={productSearch}
                  onSearch={setProductSearch}
                />
              </div>
            ) : null}

            {activeTab.categoryMode && !activeTab.productMode ? (
              <SelectList
                title="Category Selection"
                items={filteredCategories}
                selectedIds={(activeSection.categoryIds || []).map(String)}
                onToggle={(id) => toggleRelation("categoryIds", id)}
                getLabel={(category) => category.name || "Unnamed category"}
                emptyMessage="No categories found."
                search={categorySearch}
                onSearch={setCategorySearch}
              />
            ) : null}

            {activeTab.imageMode ? (
              <Field label="Banner Image">
                <div className="grid gap-4">
                  <UploadField
                    value={activeSection.imageUrl || ""}
                    onChange={(value) => updateActiveSection({ imageUrl: value })}
                    onUpload={(file) => uploadImage(file, (value) => updateActiveSection({ imageUrl: value }))}
                    uploading={uploading}
                  />

                  {activeSection.imageUrl ? (
                    <div className="overflow-hidden rounded-[24px] border border-black/8 bg-[#fcfaf7] p-3">
                      <div className="mb-3 text-sm font-semibold text-slate-900">Banner Preview</div>
                      <div className="overflow-hidden rounded-[18px]">
                        <img src={activeSection.imageUrl} alt="Banner preview" className="h-[220px] w-full object-cover" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </Field>
            ) : null}

            <div className="flex justify-end border-t border-black/6 pt-4">
              <button
                type="button"
                onClick={saveSection}
                disabled={saving}
                className="rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Section"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
