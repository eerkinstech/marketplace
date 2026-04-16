"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { DataTable } from "@/components/dashboard/DataTable";
import { SectionCard } from "@/components/dashboard/SectionCard";

function buildPagePath(page) {
  return `${page.type === "policy" ? "/policies" : "/pages"}/${page.slug}`;
}

export default function AdminPagesPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage pages.");
  const [pages, setPages] = useState([]);

  async function load() {
    if (!token) return;
    try {
      const response = await marketplaceApi.getAdminPages(token);
      setPages(response.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [token]);

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="page-title">Dynamic pages</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage storefront content pages and jump into the rich builder to create new ones.
          </p>
        </div>

        <Link href="/admin/pages/new" className="btn-primary">
          Create page
        </Link>
      </div>

      {error ? <div className="card section small">{error}</div> : null}
      <SectionCard title="All pages" description="Edit existing pages or create new landing pages, support pages, and policies.">
        <DataTable
          rows={pages}
          columns={[
            { key: "type", label: "Type", render: (row) => (row.type === "policy" ? "Policy" : "Page") },
            { key: "title", label: "Title" },
            { key: "slug", label: "Route", render: (row) => buildPagePath(row) },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Link className="btn-secondary" href={buildPagePath(row)} target="_blank">
                    View
                  </Link>
                  <Link className="btn-secondary" href={`/admin/pages/new?id=${row._id}`}>
                    Edit
                  </Link>
                </div>
              )
            }
          ]}
        />
      </SectionCard>
    </section>
  );
}
