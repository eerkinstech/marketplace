"use client";

import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const SECTION_TYPES = [
  { value: "hero_slider", label: "Hero Slider" },
  { value: "category_strip", label: "Category Strip" },
  { value: "category_grid", label: "Category Grid" },
  { value: "product_carousel", label: "Product Carousel" },
  { value: "product_grid", label: "Product Grid" },
  { value: "banner", label: "Banner" },
  { value: "split_banner", label: "Split Banner" },
  { value: "article_grid", label: "Article Grid" }
];

const EDITOR_TABS = [
  { id: "details", label: "Details" },
  { id: "content", label: "Heading & Content" },
  { id: "links", label: "Products / Categories" },
  { id: "items", label: "Slides / Items" },
  { id: "design", label: "Design" }
];

function generateSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

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

function createEmptySection(type = "hero_slider", order = 0) {
  return {
    _id: `draft-${Date.now()}`,
    isDraft: true,
    name: "New Section",
    slug: `new-section-${order + 1}`,
    sectionType: type,
    order,
    isActive: true,
    eyebrow: "",
    title: "",
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
    limit: 6,
    categoryIds: [],
    productIds: [],
    items: type === "banner" ? [createEmptyItem()] : type === "hero_slider" || type === "split_banner" || type === "article_grid" ? [createEmptyItem()] : []
  };
}

function updateSectionList(sections, nextSection) {
  return sections.map((section) => (String(section._id) === String(nextSection._id) ? nextSection : section));
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

function SelectableList({ title, items, selectedIds, onToggle, emptyMessage, getLabel }) {
  return (
    <div className="rounded-[24px] border border-black/8 bg-[#fcfaf7] p-4">
      <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1">
        {!items.length ? <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">{emptyMessage}</div> : null}
        {items.map((item) => {
          const checked = selectedIds.includes(String(item._id));
          return (
            <label
              key={item._id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${checked ? "border-[#0a5a46] bg-[#edf7f2]" : "border-black/8 bg-white hover:bg-[#f8f5f1]"
                }`}
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

export default function AdminCollectionsPage() {
  const { token, error: authError, setError: setAuthError } = useAccessToken(
    "Login with an admin account to manage homepage collections."
  );

  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [activeEditorTab, setActiveEditorTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    if (!token) return;

    async function loadPage() {
      try {
        setLoading(true);
        const [sectionsResponse, productsResponse, categoriesResponse] = await Promise.all([
          marketplaceApi.getAdminHomeSections(token),
          marketplaceApi.getAdminProducts(token),
          marketplaceApi.getAdminCategories(token)
        ]);

        const nextSections = normalizeCollection(sectionsResponse);
        const nextProducts = normalizeProducts(productsResponse);
        const nextCategories = normalizeCollection(categoriesResponse?.data || categoriesResponse);

        setSections(nextSections);
        setProducts(nextProducts);
        setCategories(nextCategories);
        setActiveSectionId((current) => current || nextSections[0]?._id || "");
        setPageError("");
      } catch (error) {
        const message = error?.message || "Failed to load collections";
        setPageError(message);
        setAuthError(message);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [token, setAuthError]);

  const activeSection = useMemo(
    () => sections.find((section) => String(section._id) === String(activeSectionId)) || null,
    [sections, activeSectionId]
  );

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      [product.name, product.slug].filter(Boolean).some((value) => value.toLowerCase().includes(term))
    );
  }, [products, productSearch]);

  const filteredCategories = useMemo(() => {
    const term = categorySearch.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) =>
      [category.name, category.slug].filter(Boolean).some((value) => value.toLowerCase().includes(term))
    );
  }, [categories, categorySearch]);

  function setSectionField(field, value) {
    if (!activeSection) return;
    const nextSection = { ...activeSection, [field]: value };
    if (field === "name" && (!activeSection.slug || activeSection.slug.startsWith("new-section-"))) {
      nextSection.slug = generateSlug(value);
    }
    setSections((current) => updateSectionList(current, nextSection));
  }

  function setItemField(index, field, value) {
    if (!activeSection) return;
    const nextItems = [...(activeSection.items || [])];
    nextItems[index] = { ...(nextItems[index] || createEmptyItem()), [field]: value };
    setSections((current) => updateSectionList(current, { ...activeSection, items: nextItems }));
  }

  function addItem() {
    if (!activeSection) return;
    setSections((current) =>
      updateSectionList(current, { ...activeSection, items: [...(activeSection.items || []), createEmptyItem()] })
    );
  }

  function removeItem(index) {
    if (!activeSection) return;
    const nextItems = (activeSection.items || []).filter((_, itemIndex) => itemIndex !== index);
    setSections((current) => updateSectionList(current, { ...activeSection, items: nextItems }));
  }

  function toggleRelation(field, id) {
    if (!activeSection) return;
    const currentIds = Array.isArray(activeSection[field]) ? activeSection[field].map(String) : [];
    const nextIds = currentIds.includes(id) ? currentIds.filter((value) => value !== id) : [...currentIds, id];
    setSections((current) => updateSectionList(current, { ...activeSection, [field]: nextIds }));
  }

  function handleTypeChange(nextType) {
    if (!activeSection) return;
    const nextSection = {
      ...activeSection,
      sectionType: nextType
    };

    if (["hero_slider", "banner", "split_banner", "article_grid"].includes(nextType) && (!activeSection.items || !activeSection.items.length)) {
      nextSection.items = [createEmptyItem()];
    }

    if (!["hero_slider", "banner", "split_banner", "article_grid"].includes(nextType)) {
      nextSection.items = [];
    }

    setSections((current) => updateSectionList(current, nextSection));
  }

  function createSection() {
    const nextSection = createEmptySection("hero_slider", sections.length);
    setSections((current) => [...current, nextSection]);
    setActiveSectionId(nextSection._id);
    setActiveEditorTab("details");
    setNotice("");
  }

  async function saveSection() {
    if (!token || !activeSection) return;
    if (!activeSection.name?.trim()) {
      setPageError("Section name is required.");
      setActiveEditorTab("details");
      return;
    }

    const payload = {
      name: activeSection.name,
      slug: activeSection.slug || generateSlug(activeSection.name),
      sectionType: activeSection.sectionType,
      order: Number(activeSection.order || 0),
      isActive: Boolean(activeSection.isActive),
      eyebrow: activeSection.eyebrow || "",
      title: activeSection.title || "",
      subtitle: activeSection.subtitle || "",
      description: activeSection.description || "",
      ctaLabel: activeSection.ctaLabel || "",
      ctaHref: activeSection.ctaHref || "",
      theme: activeSection.theme || "light",
      backgroundColor: activeSection.backgroundColor || "",
      textColor: activeSection.textColor || "",
      accentColor: activeSection.accentColor || "",
      imageUrl: activeSection.imageUrl || "",
      mobileImageUrl: activeSection.mobileImageUrl || "",
      limit: Number(activeSection.limit || 6),
      categoryIds: (activeSection.categoryIds || []).map(String),
      productIds: (activeSection.productIds || []).map(String),
      items: (activeSection.items || []).map((item) => ({
        eyebrow: item.eyebrow || "",
        title: item.title || "",
        subtitle: item.subtitle || "",
        description: item.description || "",
        label: item.label || "",
        href: item.href || "",
        imageUrl: item.imageUrl || "",
        mobileImageUrl: item.mobileImageUrl || "",
        backgroundColor: item.backgroundColor || "",
        textColor: item.textColor || "",
        accentColor: item.accentColor || "",
        badge: item.badge || ""
      }))
    };

    try {
      setSaving(true);
      setPageError("");
      const response = activeSection.isDraft
        ? await marketplaceApi.createAdminHomeSection(token, payload)
        : await marketplaceApi.updateAdminHomeSection(token, activeSection._id, payload);
      const saved = response?.data || response;
      const nextSaved = { ...saved, isDraft: false };

      setSections((current) => {
        if (activeSection.isDraft) {
          return current.map((section) => (String(section._id) === String(activeSection._id) ? nextSaved : section));
        }
        return updateSectionList(current, nextSaved);
      });
      setActiveSectionId(nextSaved._id);
      setNotice(`Saved "${nextSaved.name}".`);
    } catch (error) {
      setPageError(error?.message || "Failed to save section");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSection() {
    if (!activeSection) return;
    if (!window.confirm(`Delete "${activeSection.name}"?`)) return;

    if (activeSection.isDraft) {
      const nextSections = sections.filter((section) => String(section._id) !== String(activeSection._id));
      setSections(nextSections);
      setActiveSectionId(nextSections[0]?._id || "");
      return;
    }

    try {
      setSaving(true);
      await marketplaceApi.deleteAdminHomeSection(token, activeSection._id);
      const nextSections = sections.filter((section) => String(section._id) !== String(activeSection._id));
      setSections(nextSections);
      setActiveSectionId(nextSections[0]?._id || "");
      setNotice("Section deleted.");
      setPageError("");
    } catch (error) {
      setPageError(error?.message || "Failed to delete section");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="container page-section stack">
      <div className="grid gap-3 lg:grid-cols-[1.1fr_auto] lg:items-end">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9a6b36]">Admin Panel</div>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-900">Collections</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Build the homepage section-by-section. Each collection is a tab, and each tab has separate editing panels for headings,
            product/category selection, slide items, and visual styling.
          </p>
        </div>

        <button
          type="button"
          onClick={createSection}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#111111] px-5 text-sm font-semibold text-white"
        >
          Add Section Tab
        </button>
      </div>

      {authError ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{authError}</div> : null}
      {pageError ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{pageError}</div> : null}
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{notice}</div> : null}

      <div className="rounded-[30px] border border-black/6 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-black/6 p-4">
          <div className="flex gap-2 overflow-x-auto">
            {sections.map((section, index) => {
              const isActive = String(section._id) === String(activeSectionId);
              return (
                <button
                  key={section._id}
                  type="button"
                  onClick={() => setActiveSectionId(section._id)}
                  className={`min-w-[220px] rounded-[22px] border px-4 py-3 text-left transition ${isActive
                      ? "border-[#0a5a46] bg-[#edf7f2] shadow-[0_12px_30px_rgba(10,90,70,0.12)]"
                      : "border-black/8 bg-[#faf7f2] hover:bg-[#f4efe8]"
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Section {index + 1}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${section.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {section.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <div className="mt-2 truncate text-base font-black text-slate-900">{section.name || "Untitled section"}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {SECTION_TYPES.find((entry) => entry.value === section.sectionType)?.label || section.sectionType}
                  </div>
                </button>
              );
            })}

            {!sections.length && !loading ? (
              <div className="rounded-[22px] border border-dashed border-black/10 bg-[#faf7f2] px-5 py-4 text-sm text-slate-500">
                No homepage sections yet. Create the first section tab.
              </div>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-slate-500">Loading collections...</div>
        ) : activeSection ? (
          <>
            <div className="border-b border-black/6 px-4 pt-4">
              <div className="flex gap-2 overflow-x-auto">
                {EDITOR_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveEditorTab(tab.id)}
                    className={`rounded-t-2xl px-4 py-3 text-sm font-semibold transition ${activeEditorTab === tab.id
                        ? "bg-[#111111] text-white"
                        : "bg-[#f4efe8] text-slate-600 hover:bg-[#ece4d9]"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 p-6">
              {activeEditorTab === "details" ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Section Name">
                    <TextInput value={activeSection.name || ""} onChange={(event) => setSectionField("name", event.target.value)} />
                  </Field>
                  <Field label="Slug">
                    <TextInput value={activeSection.slug || ""} onChange={(event) => setSectionField("slug", generateSlug(event.target.value))} />
                  </Field>
                  <Field label="Section Type">
                    <select
                      value={activeSection.sectionType}
                      onChange={(event) => handleTypeChange(event.target.value)}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0a5a46]"
                    >
                      {SECTION_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Order">
                    <TextInput type="number" value={activeSection.order ?? 0} onChange={(event) => setSectionField("order", Number(event.target.value || 0))} />
                  </Field>
                  <Field label="Limit" hint="Used when the section auto-fills products by category.">
                    <TextInput type="number" min="1" max="24" value={activeSection.limit ?? 6} onChange={(event) => setSectionField("limit", Number(event.target.value || 6))} />
                  </Field>
                  <Field label="Theme">
                    <TextInput value={activeSection.theme || ""} onChange={(event) => setSectionField("theme", event.target.value)} placeholder="light or dark" />
                  </Field>
                  <label className="flex items-center gap-3 rounded-[24px] border border-black/8 bg-[#faf7f2] px-4 py-4 text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(activeSection.isActive)}
                      onChange={(event) => setSectionField("isActive", event.target.checked)}
                      className="h-4 w-4 rounded border-black/20"
                    />
                    Show this section on the homepage
                  </label>
                </div>
              ) : null}

              {activeEditorTab === "content" ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label="Eyebrow">
                    <TextInput value={activeSection.eyebrow || ""} onChange={(event) => setSectionField("eyebrow", event.target.value)} />
                  </Field>
                  <Field label="Heading">
                    <TextInput value={activeSection.title || ""} onChange={(event) => setSectionField("title", event.target.value)} />
                  </Field>
                  <Field label="Subtitle">
                    <TextArea rows={3} value={activeSection.subtitle || ""} onChange={(event) => setSectionField("subtitle", event.target.value)} />
                  </Field>
                  <Field label="Description">
                    <TextArea rows={5} value={activeSection.description || ""} onChange={(event) => setSectionField("description", event.target.value)} />
                  </Field>
                  <Field label="CTA Label">
                    <TextInput value={activeSection.ctaLabel || ""} onChange={(event) => setSectionField("ctaLabel", event.target.value)} />
                  </Field>
                  <Field label="CTA Link">
                    <TextInput value={activeSection.ctaHref || ""} onChange={(event) => setSectionField("ctaHref", event.target.value)} placeholder="/products" />
                  </Field>
                </div>
              ) : null}

              {activeEditorTab === "links" ? (
                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="grid gap-3">
                    <TextInput
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search products"
                    />
                    <SelectableList
                      title="Products"
                      items={filteredProducts}
                      selectedIds={(activeSection.productIds || []).map(String)}
                      onToggle={(id) => toggleRelation("productIds", id)}
                      emptyMessage="No products found."
                      getLabel={(product) => product.name || "Unnamed product"}
                    />
                  </div>

                  <div className="grid gap-3">
                    <TextInput
                      value={categorySearch}
                      onChange={(event) => setCategorySearch(event.target.value)}
                      placeholder="Search categories"
                    />
                    <SelectableList
                      title="Categories"
                      items={filteredCategories}
                      selectedIds={(activeSection.categoryIds || []).map(String)}
                      onToggle={(id) => toggleRelation("categoryIds", id)}
                      emptyMessage="No categories found."
                      getLabel={(category) => category.name || "Unnamed category"}
                    />
                  </div>
                </div>
              ) : null}

              {activeEditorTab === "items" ? (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-slate-900">Section Items</div>
                      <div className="text-sm text-slate-500">Use items for hero slides, banners, split sections, and article cards.</div>
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="rounded-2xl border border-black/10 bg-[#faf7f2] px-4 py-2.5 text-sm font-semibold text-slate-900"
                    >
                      Add Item
                    </button>
                  </div>

                  {!activeSection.items?.length ? (
                    <div className="rounded-[24px] border border-dashed border-black/10 bg-[#faf7f2] p-6 text-sm text-slate-500">
                      No items yet. Add slides/cards for this section from the button above.
                    </div>
                  ) : null}

                  {(activeSection.items || []).map((item, index) => (
                    <div key={`${activeSection._id}-item-${index}`} className="rounded-[28px] border border-black/8 bg-[#fcfaf7] p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="text-base font-black text-slate-900">Item {index + 1}</div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <Field label="Item Eyebrow">
                          <TextInput value={item.eyebrow || ""} onChange={(event) => setItemField(index, "eyebrow", event.target.value)} />
                        </Field>
                        <Field label="Item Title">
                          <TextInput value={item.title || ""} onChange={(event) => setItemField(index, "title", event.target.value)} />
                        </Field>
                        <Field label="Subtitle">
                          <TextArea rows={3} value={item.subtitle || ""} onChange={(event) => setItemField(index, "subtitle", event.target.value)} />
                        </Field>
                        <Field label="Description">
                          <TextArea rows={3} value={item.description || ""} onChange={(event) => setItemField(index, "description", event.target.value)} />
                        </Field>
                        <Field label="Badge">
                          <TextInput value={item.badge || ""} onChange={(event) => setItemField(index, "badge", event.target.value)} />
                        </Field>
                        <Field label="CTA Label">
                          <TextInput value={item.label || ""} onChange={(event) => setItemField(index, "label", event.target.value)} />
                        </Field>
                        <Field label="CTA Link">
                          <TextInput value={item.href || ""} onChange={(event) => setItemField(index, "href", event.target.value)} />
                        </Field>
                        <Field label="Image URL">
                          <TextInput value={item.imageUrl || ""} onChange={(event) => setItemField(index, "imageUrl", event.target.value)} />
                        </Field>
                        <Field label="Mobile Image URL">
                          <TextInput value={item.mobileImageUrl || ""} onChange={(event) => setItemField(index, "mobileImageUrl", event.target.value)} />
                        </Field>
                        <Field label="Background Color">
                          <TextInput value={item.backgroundColor || ""} onChange={(event) => setItemField(index, "backgroundColor", event.target.value)} />
                        </Field>
                        <Field label="Text Color">
                          <TextInput value={item.textColor || ""} onChange={(event) => setItemField(index, "textColor", event.target.value)} />
                        </Field>
                        <Field label="Accent Color">
                          <TextInput value={item.accentColor || ""} onChange={(event) => setItemField(index, "accentColor", event.target.value)} />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeEditorTab === "design" ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Background Color / Gradient">
                    <TextInput value={activeSection.backgroundColor || ""} onChange={(event) => setSectionField("backgroundColor", event.target.value)} placeholder="linear-gradient(...)" />
                  </Field>
                  <Field label="Text Color">
                    <TextInput value={activeSection.textColor || ""} onChange={(event) => setSectionField("textColor", event.target.value)} placeholder="#10201a" />
                  </Field>
                  <Field label="Accent Color">
                    <TextInput value={activeSection.accentColor || ""} onChange={(event) => setSectionField("accentColor", event.target.value)} placeholder="#0a5a46" />
                  </Field>
                  <Field label="Desktop Image URL">
                    <TextInput value={activeSection.imageUrl || ""} onChange={(event) => setSectionField("imageUrl", event.target.value)} />
                  </Field>
                  <Field label="Mobile Image URL">
                    <TextInput value={activeSection.mobileImageUrl || ""} onChange={(event) => setSectionField("mobileImageUrl", event.target.value)} />
                  </Field>
                  <div className="rounded-[24px] border border-black/8 bg-[#fcfaf7] p-4 text-sm text-slate-600">
                    Use this tab for section-wide colors and imagery. Item-level colors/images can be edited in the
                    <span className="font-semibold text-slate-900"> Slides / Items </span>
                    tab.
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-black/6 bg-[#faf7f2] px-6 py-4">
              <button
                type="button"
                onClick={deleteSection}
                disabled={saving}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
              >
                Delete Section
              </button>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={saveSection}
                  disabled={saving}
                  className="rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : activeSection.isDraft ? "Create Section" : "Save Changes"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-sm text-slate-500">Create a section tab to start editing homepage collections.</div>
        )}
      </div>
    </section>
  );
}
