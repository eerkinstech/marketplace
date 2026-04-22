"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import CategoryModal from "@/components/admin/CategoryModal";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

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
    add: <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />,
    upload: <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0-4 4m4-4 4 4M5 18v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" />,
    download: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0 4-4m-4 4-4-4M5 18v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10a2.12 2.12 0 1 0-3-3L5 17v3Z" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  };

  return <svg {...props}>{icons[name]}</svg>;
}

function generateSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function getParentId(category) {
  return category?.parentId || category?.parent?._id || category?.parent || "";
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
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values;
}

function toCsvValue(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return true;
  return ["1", "true", "yes", "active", "enabled"].includes(text);
}

function getRowValue(row, keys) {
  const wanted = keys.map((key) => String(key).toLowerCase());
  const match = Object.entries(row).find(([key]) => wanted.includes(String(key).trim().toLowerCase()));
  return match?.[1] ?? "";
}

function resolveCategoryReference(value, categories) {
  const key = String(value || "").trim().toLowerCase();
  if (!key) return "";
  const category = categories.find((entry) =>
    [entry._id, entry.slug, entry.name]
      .filter(Boolean)
      .some((candidate) => String(candidate).trim().toLowerCase() === key)
  );
  return category?._id || "";
}

function buildCategoryPayloadFromRow(row, categories, rowNumber) {
  const name = String(getRowValue(row, ["name", "title"]) || "").trim();
  const slug = String(getRowValue(row, ["slug"]) || generateSlug(name)).trim();
  if (!name || !slug) {
    throw new Error(`Import row ${rowNumber} is missing name or slug.`);
  }

  const parentId = resolveCategoryReference(getRowValue(row, ["parentId", "parentSlug", "parentName", "parent"]), categories);

  return {
    id: String(getRowValue(row, ["id", "_id"]) || "").trim(),
    parentRef: String(getRowValue(row, ["parentId", "parentSlug", "parentName", "parent"]) || "").trim(),
    payload: {
      name,
      slug,
      parentId: parentId || undefined,
      description: String(getRowValue(row, ["description"]) || "").trim(),
      image: String(getRowValue(row, ["image", "imageUrl"]) || "").trim(),
      isActive: parseBoolean(getRowValue(row, ["isActive", "active", "status"])),
      metaTitle: String(getRowValue(row, ["metaTitle", "seo.metaTitle"]) || "").trim(),
      metaDescription: String(getRowValue(row, ["metaDescription", "seo.metaDescription"]) || "").trim(),
      metaKeywords: String(getRowValue(row, ["metaKeywords", "keywords", "seo.keywords"]) || "").trim()
    }
  };
}

function parseCategoryImportFile(text, filename, categories) {
  if (filename.toLowerCase().endsWith(".json")) {
    const rows = JSON.parse(text);
    if (!Array.isArray(rows)) throw new Error("JSON import must be an array of categories.");
    return rows.map((row, index) => buildCategoryPayloadFromRow(row, categories, index + 1));
  }

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV import must include a header row and at least one category row.");
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = headers.reduce((accumulator, header, headerIndex) => {
      accumulator[header] = values[headerIndex] ?? "";
      return accumulator;
    }, {});
    return buildCategoryPayloadFromRow(row, categories, index + 2);
  });
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

function buildTree(categories, parentId = "") {
  return categories
    .filter((category) => String(getParentId(category) || "") === String(parentId || ""))
    .map((category) => ({
      ...category,
      children: buildTree(categories, category._id)
    }));
}

function flattenTree(nodes, depth = 0) {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...flattenTree(node.children || [], depth + 1)
  ]);
}

function collectDescendantIds(categories, parentId) {
  const childIds = categories
    .filter((category) => String(getParentId(category) || "") === String(parentId || ""))
    .map((category) => String(category._id));

  return childIds.reduce((allIds, childId) => {
    allIds.push(childId, ...collectDescendantIds(categories, childId));
    return allIds;
  }, []);
}

function CategoryRow({
  category,
  depth = 0,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
  onAddSubcategory
}) {
  const hasChildren = Array.isArray(category.children) && category.children.length > 0;
  const isExpanded = expandedIds.has(String(category._id));
  const image = category.image || "";

  return (
    <>
      <tr className="border-b border-[#ece5db] align-middle transition hover:bg-[#fcfaf7] last:border-b-0">
        <td className="px-5 py-5">
          <input type="checkbox" className="rounded" />
        </td>
        <td className="px-5 py-5">
          <div className="flex items-center gap-3" style={{ paddingLeft: `${depth * 20}px` }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggle(category._id)}
                className="mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-xs text-slate-600"
              >
                {isExpanded ? "-" : "+"}
              </button>
            ) : (
              <span className="mt-2 inline-block h-6 w-6" />
            )}

            {image ? (
              <img
                src={image}
                alt={category.name}
                className="h-14 w-14 rounded-2xl border border-black/8 object-cover bg-[#f5efe5]"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/8 bg-[#f5efe5] text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a6b36]">
                Cat
              </div>
            )}

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-[17px] font-semibold leading-6 text-slate-950">{category.name}</div>
                <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${depth === 0 ? "bg-[#efe1d1] text-[#8a5725]" : "bg-slate-100 text-slate-600"}`}>
                  {depth === 0 ? "Main" : `Sub ${depth}`}
                </span>
              </div>

            </div>
          </div>
        </td>
        <td className="px-5 py-5">
          <div className="inline-flex min-w-16 items-center justify-center rounded-full bg-[#f3efe8] px-4 py-2 text-sm font-semibold text-[#5f4a35]">
            {category.productCount || 0}
          </div>
        </td>
        <td className="px-5 py-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAddSubcategory(category)}
              className="rounded-xl border border-[#d7c5b1] bg-[#fbf7f1] px-3 py-2 text-xs font-semibold text-[#84552b] transition hover:bg-[#f4ece2]"
            >
              Add Sub
            </button>
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              title="Edit category"
            >
              <Icon name="edit" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(category._id)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
              title="Delete category"
            >
              <Icon name="trash" />
            </button>
          </div>
        </td>
      </tr>

      {hasChildren && isExpanded
        ? category.children.map((child) => (
          <CategoryRow
            key={child._id}
            category={child}
            depth={depth + 1}
            expandedIds={expandedIds}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubcategory={onAddSubcategory}
          />
        ))
        : null}
    </>
  );
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  image: null,
  imageFile: null,
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  parentId: "",
  isActive: true
};

export default function AdminCategoriesPage() {
  const { token, error: authError, setError: setAuthError } = useAccessToken(
    "Login with an admin account to manage categories."
  );
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("plain");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [originalSlug, setOriginalSlug] = useState("");
  const [shouldCreateRedirect, setShouldCreateRedirect] = useState(false);
  const importInputRef = useRef(null);

  async function loadCategories() {
    if (!token) return;

    try {
      setLoading(true);
      const response = await marketplaceApi.getAdminCategories(token);
      const rows = response?.data || [];
      setCategories(rows);
      setPageError("");
    } catch (error) {
      const message = error?.message || "Failed to load categories";
      setPageError(message);
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, [token]);

  const categoryTree = useMemo(() => buildTree(categories), [categories]);
  const flatCategories = useMemo(() => flattenTree(categoryTree), [categoryTree]);

  const filteredFlatCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return flatCategories;

    return flatCategories.filter((category) =>
      [category.name, category.slug, category.description, category.parent?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [flatCategories, search]);

  const filteredTree = useMemo(() => {
    const allowedIds = new Set(filteredFlatCategories.map((category) => String(category._id)));

    function filterNodes(nodes) {
      return nodes
        .map((node) => {
          const children = filterNodes(node.children || []);
          if (allowedIds.has(String(node._id)) || children.length) {
            return { ...node, children };
          }
          return null;
        })
        .filter(Boolean);
    }

    return search.trim() ? filterNodes(categoryTree) : categoryTree;
  }, [categoryTree, filteredFlatCategories, search]);

  const stats = useMemo(() => {
    const total = categories.length;
    const main = categories.filter((category) => !getParentId(category)).length;
    const sub = total - main;
    const totalProducts = categories.reduce((sum, category) => sum + Number(category.productCount || 0), 0);
    return { total, main, sub, totalProducts };
  }, [categories]);

  const parentOptions = useMemo(() => {
    const blockedIds = editingCategory
      ? new Set([String(editingCategory._id), ...collectDescendantIds(categories, editingCategory._id)])
      : new Set();

    return flatCategories
      .filter((category) => !blockedIds.has(String(category._id)))
      .map((category) => ({
        _id: category._id,
        name: category.name,
        label: `${"-- ".repeat(category.depth || 0)}${category.name}`
      }));
  }, [categories, editingCategory, flatCategories]);

  function handleNameChange(value) {
    setFormData((current) => ({
      ...current,
      name: value,
      slug: generateSlug(value)
    }));
  }

  function resetModalState() {
    setShowModal(false);
    setEditingCategory(null);
    setOriginalSlug("");
    setShouldCreateRedirect(false);
    setFormData(emptyForm);
  }

  function openAddCategoryModal() {
    setEditingCategory(null);
    setOriginalSlug("");
    setShouldCreateRedirect(false);
    setFormData(emptyForm);
    setShowModal(true);
  }

  function openAddSubcategoryModal(parentCategory) {
    setEditingCategory(null);
    setOriginalSlug("");
    setShouldCreateRedirect(false);
    setFormData({
      ...emptyForm,
      parentId: String(parentCategory?._id || "")
    });
    setShowModal(true);
  }

  function openEditModal(category) {
    setEditingCategory(category);
    setOriginalSlug(category.slug || "");
    setShouldCreateRedirect(false);
    setFormData({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      image: category.image || null,
      imageFile: null,
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
      metaKeywords: category.metaKeywords || "",
      parentId: String(getParentId(category) || ""),
      isActive: category.isActive !== false
    });
    setShowModal(true);
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setFormData((current) => ({
        ...current,
        image: loadEvent.target?.result || "",
        imageFile: file
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveCategory() {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      image: formData.image || "",
      parentId: formData.parentId || undefined,
      isActive: formData.isActive !== false,
      metaTitle: formData.metaTitle.trim(),
      metaDescription: formData.metaDescription.trim(),
      metaKeywords: formData.metaKeywords.trim()
    };

    try {
      setLoading(true);
      if (editingCategory) {
        await marketplaceApi.updateCategory(token, editingCategory._id, payload);
        setNotice("Category updated successfully.");
        toast.success("Category updated successfully");
      } else {
        await marketplaceApi.createCategory(token, payload);
        setNotice(payload.parentId ? "Subcategory created successfully." : "Category created successfully.");
        toast.success(payload.parentId ? "Subcategory created successfully" : "Category created successfully");
      }

      if (shouldCreateRedirect && originalSlug && originalSlug !== payload.slug) {
        console.log("URL redirect requested", {
          from: `/category/${originalSlug}`,
          to: `/category/${payload.slug}`
        });
      }

      resetModalState();
      await loadCategories();
    } catch (error) {
      const message = error?.message || "Failed to save category";
      setPageError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(categoryId) {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      setLoading(true);
      await marketplaceApi.deleteCategory(token, categoryId);
      setNotice("Category deleted successfully.");
      toast.success("Category deleted successfully");
      await loadCategories();
    } catch (error) {
      const message = error?.message || "Failed to delete category";
      setPageError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function exportCategories() {
    const headers = [
      "id", "name", "slug", "parentId", "parentSlug", "parentName", "description", "image",
      "isActive", "metaTitle", "metaDescription", "metaKeywords", "productCount", "createdAt", "updatedAt"
    ];
    const csv = [
      headers.join(","),
      ...filteredFlatCategories.map((category) => [
        category._id || "",
        category.name || "",
        category.slug || "",
        getParentId(category) || "",
        category.parent?.slug || "",
        category.parent?.name || "",
        category.description || "",
        category.image || "",
        category.isActive === false ? "false" : "true",
        category.metaTitle || category.seo?.metaTitle || "",
        category.metaDescription || category.seo?.metaDescription || "",
        category.metaKeywords || (category.seo?.keywords || []).join(", "),
        category.productCount || 0,
        category.createdAt || "",
        category.updatedAt || ""
      ].map(toCsvValue).join(","))
    ].join("\n");

    downloadFile("admin-categories-export.csv", csv, "text/csv;charset=utf-8");
    setNotice(`${filteredFlatCategories.length} categories exported.`);
  }

  async function handleImportCategories(event) {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    try {
      setLoading(true);
      const rows = parseCategoryImportFile(await file.text(), file.name, categories);
      const knownCategories = [...categories];
      let created = 0;
      let updated = 0;

      for (const row of rows) {
        if (!row.payload.parentId && row.parentRef) {
          const parentId = resolveCategoryReference(row.parentRef, knownCategories);
          if (parentId) row.payload.parentId = parentId;
        }

        const existing = knownCategories.find((category) =>
          (row.id && String(category._id) === row.id) ||
          String(category.slug || "").toLowerCase() === String(row.payload.slug || "").toLowerCase()
        );

        if (existing?._id) {
          const response = await marketplaceApi.updateCategory(token, existing._id, row.payload);
          const updatedCategory = response?.data || { ...existing, ...row.payload, _id: existing._id };
          const knownIndex = knownCategories.findIndex((category) => String(category._id) === String(existing._id));
          if (knownIndex >= 0) knownCategories[knownIndex] = updatedCategory;
          updated += 1;
        } else {
          const response = await marketplaceApi.createCategory(token, row.payload);
          if (response?.data) knownCategories.push(response.data);
          created += 1;
        }
      }

      setNotice(`Imported ${rows.length} categories (${created} created, ${updated} updated).`);
      toast.success(`Imported ${rows.length} categories`);
      await loadCategories();
    } catch (error) {
      const message = error?.message || "Failed to import categories";
      setPageError(message);
      toast.error(message);
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
      setLoading(false);
    }
  }

  function toggleExpanded(categoryId) {
    setExpandedIds((current) => {
      const next = new Set(current);
      const id = String(categoryId);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="container page-section stack">
      <div className="rounded-[28px] border border-[#d9c9b7] bg-[linear-gradient(180deg,#fffdfa_0%,#fff7ef_100%)] p-6 shadow-[0_24px_60px_rgba(120,53,15,0.08)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9a6b36]">Admin Panel</div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#1f2937]">Category Management</h1>

          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2f3136] px-4 py-3 text-[13px] font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Icon name="upload" />
              Import
            </button>
            <button
              type="button"
              onClick={exportCategories}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d7c5b1] bg-[#fbf7f1] px-4 py-3 text-[13px] font-semibold text-[#84552b] transition hover:bg-[#f4ece2]"
            >
              <Icon name="download" />
              Export
            </button>
            <button
              type="button"
              onClick={openAddCategoryModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#b56d2d] px-4 py-3 text-[13px] font-semibold text-white shadow-[0_10px_30px_rgba(181,109,45,0.25)] transition hover:-translate-y-0.5"
            >
              <Icon name="add" />
              Add Category
            </button>
            <input ref={importInputRef} type="file" accept=".csv,application/json" className="hidden" onChange={handleImportCategories} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="stat-chip">
          <div className="mini-label">Total categories</div>
          <div className="mt-3 text-3xl font-semibold text-ink">{stats.total}</div>
          <div className="mt-2 text-sm text-slate-600">All category records</div>
        </div>
        <div className="stat-chip">
          <div className="mini-label">Main categories</div>
          <div className="mt-3 text-3xl font-semibold text-[#8a5725]">{stats.main}</div>
          <div className="mt-2 text-sm text-slate-600">Top-level menu categories</div>
        </div>
        <div className="stat-chip">
          <div className="mini-label">Subcategories</div>
          <div className="mt-3 text-3xl font-semibold text-slate-700">{stats.sub}</div>
          <div className="mt-2 text-sm text-slate-600">Nested category items</div>
        </div>
        <div className="stat-chip">
          <div className="mini-label">Linked products</div>
          <div className="mt-3 text-3xl font-semibold text-emerald-700">{stats.totalProducts}</div>
          <div className="mt-2 text-sm text-slate-600">Products assigned to categories</div>
        </div>
      </div>

      {authError ? <div className="card section small">{authError}</div> : null}
      {pageError ? <div className="card section small">{pageError}</div> : null}
      {notice ? <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="grid gap-4 rounded-[28px] border border-black/5 bg-white/85 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.06)] md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setViewMode("plain")}
              className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${viewMode === "plain" ? "bg-[#2f3136] text-white shadow-[0_14px_28px_rgba(47,49,54,0.18)]" : "bg-[#f4efe8] text-slate-600 hover:bg-[#ede4d7]"}`}
            >
              Plain Category
            </button>
            <button
              type="button"
              onClick={() => setViewMode("menu")}
              className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${viewMode === "menu" ? "bg-[#2f3136] text-white shadow-[0_14px_28px_rgba(47,49,54,0.18)]" : "bg-[#f4efe8] text-slate-600 hover:bg-[#ede4d7]"}`}
            >
              Menu Category
            </button>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories by name, slug, description..."
              className="min-w-[280px] rounded-2xl border border-black/10 bg-[#fbfaf8] px-4 py-3 text-[13px] outline-none transition focus:border-[#b56d2d]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-700">{filteredFlatCategories.length} categories in view</div>
          <div className="text-xs text-slate-500">{viewMode === "plain" ? "Flat list view" : "Nested menu view"}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-black/6 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-[linear-gradient(180deg,#f8f4ef_0%,#f4ede4_100%)]">
            <tr className="border-b border-black/10 text-slate-600">
              <th className="px-5 py-5 text-left">
                <input type="checkbox" />
              </th>
              <th className="px-5 py-5 text-left text-base font-semibold text-slate-900">Title</th>
              <th className="px-5 py-5 text-left text-base font-semibold text-slate-900">Products</th>
              <th className="px-5 py-5 text-left text-base font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !categories.length ? (
              <tr>
                <td colSpan={4} className="px-5 py-14 text-center text-sm text-slate-500">
                  Loading categories...
                </td>
              </tr>
            ) : viewMode === "plain" ? (
              filteredFlatCategories.length ? (
                filteredFlatCategories.map((category) => (
                  <tr key={category._id} className="border-b border-[#ece5db] align-middle transition hover:bg-[#fcfaf7] last:border-b-0">
                    <td className="px-5 py-5">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3" style={{ paddingLeft: `${(category.depth || 0) * 20}px` }}>
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="h-14 w-14 rounded-2xl border border-black/8 object-cover bg-[#f5efe5]"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/8 bg-[#f5efe5] text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a6b36]">
                            Cat
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-[17px] font-semibold leading-6 text-slate-950">{category.name}</div>
                            <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${(category.depth || 0) === 0 ? "bg-[#efe1d1] text-[#8a5725]" : "bg-slate-100 text-slate-600"}`}>
                              {(category.depth || 0) === 0 ? "Main" : `Sub ${(category.depth || 0)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="inline-flex min-w-16 items-center justify-center rounded-full bg-[#f3efe8] px-4 py-2 text-sm font-semibold text-[#5f4a35]">
                        {category.productCount || 0}
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openAddSubcategoryModal(category)}
                          className="rounded-xl border border-[#d7c5b1] bg-[#fbf7f1] px-3 py-2 text-xs font-semibold text-[#84552b] transition hover:bg-[#f4ece2]"
                        >
                          Add Sub
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                        >
                          <Icon name="edit" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category._id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-14 text-center text-sm text-slate-500">
                    No categories match this filter yet.
                  </td>
                </tr>
              )
            ) : filteredTree.length ? (
              filteredTree.map((category) => (
                <CategoryRow
                  key={category._id}
                  category={category}
                  expandedIds={expandedIds}
                  onToggle={toggleExpanded}
                  onEdit={openEditModal}
                  onDelete={handleDeleteCategory}
                  onAddSubcategory={openAddSubcategoryModal}
                />
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-14 text-center text-sm text-slate-500">
                  No categories match this filter yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CategoryModal
        isOpen={showModal}
        onClose={resetModalState}
        formData={formData}
        setFormData={setFormData}
        handleImageUpload={handleImageUpload}
        handleSave={handleSaveCategory}
        isEditing={Boolean(editingCategory)}
        originalSlug={originalSlug}
        shouldCreateRedirect={shouldCreateRedirect}
        setShouldCreateRedirect={setShouldCreateRedirect}
        isLoading={loading}
        generateSlug={generateSlug}
        handleNameChange={handleNameChange}
        parentOptions={parentOptions}
      />
    </section>
  );
}
