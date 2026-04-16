"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RichTextEditor from "@/components/admin/ProductForm/RichTextEditor";

const initialFormState = {
  type: "page",
  title: "",
  slug: "",
  content: "",
  metaTitle: "",
  metaDescription: "",
  isPublished: true
};

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildPreviewPath(type, slug) {
  return `${type === "policy" ? "/policies" : "/pages"}/${slug}`;
}

export function PageEditorForm({
  mode = "create",
  initialValues,
  loading = false,
  error = "",
  onSubmit,
  onCancel,
  submitLabel
}) {
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (!initialValues) {
      setForm(initialFormState);
      return;
    }

    setForm({
      type: initialValues.type || "page",
      title: initialValues.title || "",
      slug: initialValues.slug || "",
      content: initialValues.content || "",
      metaTitle: initialValues.seo?.metaTitle || "",
      metaDescription: initialValues.seo?.metaDescription || "",
      isPublished: initialValues.isPublished ?? true
    });
  }, [initialValues]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleTitleChange = (value) => {
    setForm((current) => {
      const next = { ...current, title: value };

      if (!current.slug || current.slug === normalizeSlug(current.title)) {
        next.slug = normalizeSlug(value);
      }

      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit?.({
      type: form.type,
      title: form.title.trim(),
      slug: normalizeSlug(form.slug || form.title),
      content: form.content,
      seo: {
        metaTitle: form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim()
      },
      isPublished: form.isPublished
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-gray-900">Content type</span>
          <select
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={form.type}
            onChange={(event) => updateField("type", event.target.value)}
          >
            <option value="page">Page</option>
            <option value="policy">Policy</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-gray-900">Page title</span>
          <input
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={form.title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="About us"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs text-gray-500">
            Preview URL: {buildPreviewPath(form.type, normalizeSlug(form.slug || form.title || "your-page"))}
          </span>
          <span className="text-sm font-semibold text-gray-900">Page slug</span>
          <div className="flex gap-2">
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={form.slug}
              onChange={(event) => updateField("slug", normalizeSlug(event.target.value))}
              placeholder="about-us"
              required
            />
            <button
              type="button"
              onClick={() => updateField("slug", normalizeSlug(form.title))}
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Sync
            </button>
          </div>

        </label>
      </div>

      <RichTextEditor
        label="Page content"
        value={form.content}
        onChange={(value) => updateField("content", value)}
        placeholder="Write the page content, headings, and links..."
        rows={16}
        helperText="Create the public page body as HTML. Headings, lists, links, and code blocks are supported."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-gray-900">SEO title</span>
          <input
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={form.metaTitle}
            onChange={(event) => updateField("metaTitle", event.target.value)}
            placeholder="Custom meta title"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-gray-900">SEO description</span>
          <textarea
            className="min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            value={form.metaDescription}
            onChange={(event) => updateField("metaDescription", event.target.value)}
            placeholder="Search snippet description"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
        <label className="flex items-center gap-3 text-sm font-medium text-gray-800">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(event) => updateField("isPublished", event.target.checked)}
          />
          <span>Publish immediately</span>
        </label>

        <div className="flex flex-wrap gap-3">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-white"
            >
              Cancel
            </button>
          ) : (
            <Link
              href="/admin/pages"
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-white"
            >
              Back to pages
            </Link>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : submitLabel || (mode === "edit" ? "Update page" : "Create page")}
          </button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    </form>
  );
}
