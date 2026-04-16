"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { SectionCard } from "@/components/dashboard/SectionCard";

function createSeoForm(page) {
  return {
    metaTitle: page?.seo?.metaTitle || "",
    metaDescription: page?.seo?.metaDescription || "",
    isPublished: page?.isPublished ?? true
  };
}

function buildPagePath(page) {
  if (!page) return "";
  if (page.source === "seo-page") return page.path || "";
  return `${page.type === "policy" ? "/policies" : "/pages"}/${page.slug}`;
}

function getPageIdentity(page) {
  if (!page) return "";
  return page.source === "seo-page" ? `seo:${page.key}` : `page:${page._id}`;
}

function characterTone(length, ideal) {
  if (!length) return "text-slate-400";
  if (length > ideal + 20) return "text-amber-600";
  return "text-emerald-600";
}

export default function AdminPagesSeoPage() {
  const { token, error, setError } = useAccessToken(
    "Login with an admin account to manage page SEO."
  );
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activePageId, setActivePageId] = useState("");
  const [form, setForm] = useState(createSeoForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPages() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [dynamicResponse, seoResponse] = await Promise.all([
          marketplaceApi.getAdminPages(token),
          marketplaceApi.getAdminSeoPages(token)
        ]);
        const dynamicItems = Array.isArray(dynamicResponse?.data) ? dynamicResponse.data : [];
        const seoItems = (Array.isArray(seoResponse?.data) ? seoResponse.data : []).map((entry) => ({
          ...entry,
          source: "seo-page",
          seo: {
            metaTitle: entry.metaTitle || "",
            metaDescription: entry.metaDescription || ""
          }
        }));
        const items = [...seoItems, ...dynamicItems];
        setPages(items);

        if (items.length) {
          setActivePageId((current) => current || getPageIdentity(items[0]));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPages();
  }, [token, setError]);

  const filteredPages = pages.filter((page) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return [page.title, page.slug, page.seo?.metaTitle, page.seo?.metaDescription]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const activePage =
    pages.find((page) => getPageIdentity(page) === activePageId) ||
    filteredPages[0] ||
    pages[0] ||
    null;

  useEffect(() => {
    if (!activePage) {
      setForm(createSeoForm());
      return;
    }

    setForm(createSeoForm(activePage));
    if (getPageIdentity(activePage) !== activePageId) {
      setActivePageId(getPageIdentity(activePage));
    }
  }, [activePage, activePageId]);

  const seoCoverage = pages.filter(
    (page) => page.seo?.metaTitle?.trim() || page.seo?.metaDescription?.trim()
  ).length;

  async function handleSave(event) {
    event.preventDefault();
    if (!token || !activePage) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        metaTitle: form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim()
      };

      let updatedPage;
      if (activePage.source === "seo-page") {
        const response = await marketplaceApi.updateSeoPage(token, activePage.key, payload);
        updatedPage = {
          ...response?.data,
          source: "seo-page",
          seo: {
            metaTitle: response?.data?.metaTitle || "",
            metaDescription: response?.data?.metaDescription || ""
          }
        };
      } else {
        const response = await marketplaceApi.updatePage(token, activePage._id, {
          type: activePage.type,
          title: activePage.title,
          slug: activePage.slug,
          content: activePage.content,
          isPublished: form.isPublished,
          seo: payload
        });
        updatedPage = response?.data;
      }

      setPages((current) =>
        current.map((page) => {
          const currentId = page.source === "seo-page" ? page.key : page._id;
          const updatedId = updatedPage.source === "seo-page" ? updatedPage.key : updatedPage._id;
          return currentId === updatedId ? updatedPage : page;
        })
      );
      setForm(createSeoForm(updatedPage));
      toast.success(`SEO updated for ${updatedPage.title}`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Unable to save SEO changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="page-title">Pages SEO</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage search metadata for dynamic pages and policy content from one place.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title={String(pages.length)} description="Total SEO-managed pages and routes" />
        <SectionCard title={String(seoCoverage)} description="Pages with custom SEO content" />
        <SectionCard
          title={String(pages.filter((page) => page.source === "seo-page").length)}
          description="Designed pages managed here"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <SectionCard
          title="Page library"
          description="Search pages, inspect SEO coverage, and choose one to edit."
        >
          <div className="grid gap-4">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, slug, or existing meta copy"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Loading pages...
              </div>
            ) : filteredPages.length ? (
              <div className="grid gap-3">
                {filteredPages.map((page) => {
                  const selected = getPageIdentity(page) === getPageIdentity(activePage);
                  const hasSeo = page.seo?.metaTitle?.trim() || page.seo?.metaDescription?.trim();

                  return (
                    <button
                      key={getPageIdentity(page)}
                      type="button"
                      onClick={() => setActivePageId(getPageIdentity(page))}
                      className={`grid gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                        selected
                          ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className={`text-base font-semibold ${selected ? "text-white" : "text-slate-900"}`}>
                            {page.title}
                          </div>
                          <div className={`mt-1 text-xs ${selected ? "text-slate-300" : "text-slate-500"}`}>
                            {buildPagePath(page)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              selected
                                ? "bg-white/10 text-white"
                                : hasSeo
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {hasSeo ? "SEO ready" : "Needs SEO"}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              selected
                                ? "bg-white/10 text-white"
                                : page.source === "seo-page"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-violet-100 text-violet-700"
                            }`}
                          >
                            {page.source === "seo-page"
                              ? "Designed"
                              : page.type === "policy"
                                ? "Policy"
                                : "Page"}
                          </span>
                          {page.source !== "seo-page" ? (
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                selected
                                  ? "bg-white/10 text-white"
                                  : page.isPublished
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {page.isPublished ? "Published" : "Draft"}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <p className={`line-clamp-2 text-sm ${selected ? "text-slate-300" : "text-slate-600"}`}>
                        {page.seo?.metaDescription?.trim() || "No custom meta description added yet."}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No pages matched the current search.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={activePage ? `SEO editor: ${activePage.title}` : "SEO editor"}
          description="Update the metadata used by the public page and policy routes."
        >
          {!activePage ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Create a page first from the dynamic pages section to start managing SEO.
            </div>
          ) : (
            <form onSubmit={handleSave} className="grid gap-6">
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Page title
                  </div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{activePage.title}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Public route
                  </div>
                  <div className="mt-2 grid gap-1 text-sm text-slate-700">
                    <span>{buildPagePath(activePage)}</span>
                  </div>
                </div>
              </div>

              <label className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-900">Meta title</span>
                  <span className={`text-xs font-semibold ${characterTone(form.metaTitle.length, 60)}`}>
                    {form.metaTitle.length}/60
                  </span>
                </div>
                <input
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  value={form.metaTitle}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, metaTitle: event.target.value }))
                  }
                  placeholder={activePage.title}
                />
              </label>

              <label className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-900">Meta description</span>
                  <span className={`text-xs font-semibold ${characterTone(form.metaDescription.length, 155)}`}>
                    {form.metaDescription.length}/155
                  </span>
                </div>
                <textarea
                  className="min-h-36 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  value={form.metaDescription}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, metaDescription: event.target.value }))
                  }
                  placeholder="Summarize what this page covers so the search result snippet is clearer."
                />
              </label>

              {activePage.source !== "seo-page" ? (
                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, isPublished: event.target.checked }))
                      }
                    />
                    <span>Keep this page published</span>
                  </label>

                  <div className="text-sm text-slate-600">
                    Search engines only see content that remains public and reachable in navigation or direct links.
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  Designed pages are coded routes. Their content lives in the app, and only SEO metadata is managed here.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  {activePage.source !== "seo-page" ? (
                    <Link href={`/admin/pages/new?id=${activePage._id}`} className="btn-secondary">
                      Edit full page
                    </Link>
                  ) : null}
                  <Link href={buildPagePath(activePage)} target="_blank" className="btn-secondary">
                    Open {activePage.source === "seo-page" ? "designed page" : activePage.type === "policy" ? "policy" : "page"}
                  </Link>
                </div>

                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Saving..." : "Save SEO"}
                </button>
              </div>
            </form>
          )}
        </SectionCard>
      </div>
    </section>
  );
}
