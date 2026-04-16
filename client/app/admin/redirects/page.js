"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { SectionCard } from "@/components/dashboard/SectionCard";

const initialForm = {
  sourcePath: "",
  destinationPath: "",
  statusCode: 301,
  isActive: true,
  notes: ""
};

function formatDate(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function AdminRedirectsPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage redirects.");
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(initialForm);

  async function loadRedirects() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await marketplaceApi.getAdminRedirects(token);
      setRedirects(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRedirects();
  }, [token]);

  const filteredRedirects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return redirects;

    return redirects.filter((redirect) =>
      [redirect.sourcePath, redirect.destinationPath, redirect.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [redirects, search]);

  const metrics = useMemo(() => ([
    { title: String(redirects.length), description: "Total redirect rules" },
    { title: String(redirects.filter((redirect) => redirect.isActive !== false).length), description: "Active redirects" },
    { title: String(redirects.reduce((sum, redirect) => sum + Number(redirect.hitCount || 0), 0)), description: "Tracked redirect hits" }
  ]), [redirects]);

  function resetForm() {
    setForm(initialForm);
    setEditingId("");
  }

  function startEdit(redirect) {
    setEditingId(redirect._id);
    setForm({
      sourcePath: redirect.sourcePath || "",
      destinationPath: redirect.destinationPath || "",
      statusCode: Number(redirect.statusCode || 301),
      isActive: redirect.isActive !== false,
      notes: redirect.notes || ""
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        sourcePath: form.sourcePath.trim(),
        destinationPath: form.destinationPath.trim(),
        statusCode: Number(form.statusCode || 301),
        isActive: Boolean(form.isActive),
        notes: form.notes.trim()
      };

      if (!payload.sourcePath || !payload.destinationPath) {
        throw new Error("Source and destination paths are required.");
      }

      if (editingId) {
        await marketplaceApi.updateRedirect(token, editingId, payload);
        toast.success("Redirect updated");
      } else {
        await marketplaceApi.createRedirect(token, payload);
        toast.success("Redirect created");
      }

      resetForm();
      await loadRedirects();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Unable to save redirect");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(redirect) {
    if (!token) return;
    if (!window.confirm(`Delete redirect from ${redirect.sourcePath}?`)) return;

    try {
      setDeletingId(redirect._id);
      setError("");
      await marketplaceApi.deleteRedirect(token, redirect._id);
      toast.success("Redirect deleted");
      if (editingId === redirect._id) resetForm();
      await loadRedirects();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Unable to delete redirect");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="page-title">URL Redirects</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create permanent or temporary redirects and make them live across storefront routes.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <SectionCard key={metric.description} title={metric.title} description={metric.description} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.2fr]">
        <SectionCard
          title={editingId ? "Edit redirect" : "Create redirect"}
          description="Source paths should start with `/`. Destinations can be internal paths or full external URLs."
        >
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Source path</span>
              <input
                type="text"
                value={form.sourcePath}
                onChange={(event) => setForm((current) => ({ ...current, sourcePath: event.target.value }))}
                placeholder="/old-page"
                className="field-input"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Destination</span>
              <input
                type="text"
                value={form.destinationPath}
                onChange={(event) => setForm((current) => ({ ...current, destinationPath: event.target.value }))}
                placeholder="/new-page or https://example.com/page"
                className="field-input"
              />
            </label>

            <div className="flex flex-col gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-ink">Redirect type</span>
                <select
                  value={form.statusCode}
                  onChange={(event) => setForm((current) => ({ ...current, statusCode: Number(event.target.value) }))}
                  className="field-input"
                >
                  <option value={301}>301 Permanent</option>
                  <option value={302}>302 Temporary</option>
                </select>
              </label>

              <label className="inline-flex items-center gap-3 rounded-2xl border border-black/8 bg-slate-50 px-4 py-3 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
                Active redirect
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional reason or migration note"
                rows={4}
                className="field-input min-h-[120px]"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Saving..." : editingId ? "Update redirect" : "Create redirect"}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                {editingId ? "Cancel edit" : "Reset"}
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Redirect library"
          description="Search, inspect, and manage the redirect rules used by the storefront middleware."
        >
          <div className="grid gap-4">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search source path, destination, or notes"
              className="field-input"
            />

            {loading ? (
              <div className="rounded-2xl border border-dashed border-black/10 px-4 py-12 text-center text-sm text-slate-500">
                Loading redirects...
              </div>
            ) : filteredRedirects.length ? (
              <div className="grid gap-3">
                {filteredRedirects.map((redirect) => (
                  <article key={redirect._id} className="rounded-2xl border border-black/8 bg-white px-4 py-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            {redirect.statusCode}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${redirect.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                            {redirect.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="mt-3 font-mono text-sm font-semibold text-slate-900">{redirect.sourcePath}</div>
                        <div className="mt-1 break-all text-sm text-slate-600">{redirect.destinationPath}</div>
                        {redirect.notes ? <div className="mt-2 text-sm text-slate-500">{redirect.notes}</div> : null}
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>Hits: {Number(redirect.hitCount || 0)}</span>
                          <span>Last matched: {formatDate(redirect.lastMatchedAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => startEdit(redirect)} className="btn-secondary">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(redirect)}
                          disabled={deletingId === redirect._id}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === redirect._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-black/10 px-4 py-12 text-center text-sm text-slate-500">
                No redirects matched the current search.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
