"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { PageEditorForm } from "@/components/admin/PageEditorForm";
import { SectionCard } from "@/components/dashboard/SectionCard";

function AdminPageBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageId = searchParams.get("id");
  const isEditing = Boolean(pageId);
  const { token, error, setError } = useAccessToken("Login with an admin account to manage pages.");
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadPages() {
      if (!token) {
        setLoaded(true);
        return;
      }

      try {
        const response = await marketplaceApi.getAdminPages(token);
        setPages(response.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoaded(true);
      }
    }

    loadPages();
  }, [setError, token]);

  const currentPage = useMemo(
    () => (isEditing ? pages.find((entry) => entry._id === pageId) || null : null),
    [isEditing, pageId, pages]
  );

  async function handleSubmit(payload) {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (isEditing) {
        await marketplaceApi.updatePage(token, pageId, payload);
      } else {
        await marketplaceApi.createPage(token, payload);
      }

      router.push("/admin/pages");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="page-title">{isEditing ? "Edit page" : "Create page"}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Build public content entries with a selected route type, custom slug, SEO, and rich formatted content.
          </p>
        </div>
      </div>

      <SectionCard
        title={isEditing ? "Page editor" : "New page"}
        description="Choose whether this entry is a page or policy, then build the public content with the rich editor."
      >
        {isEditing && !loaded && token ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Loading page details...
          </div>
        ) : isEditing && loaded && !currentPage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            The selected page could not be found.
          </div>
        ) : (
          <PageEditorForm
            mode={isEditing ? "edit" : "create"}
            initialValues={currentPage}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
          />
        )}
      </SectionCard>
    </section>
  );
}

export default function AdminPageBuilderPage() {
  return (
    <Suspense fallback={<section className="grid gap-6"><div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">Loading page builder...</div></section>}>
      <AdminPageBuilderContent />
    </Suspense>
  );
}
