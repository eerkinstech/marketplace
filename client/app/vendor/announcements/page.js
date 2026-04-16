"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString();
}

export default function VendorAnnouncementsPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to view announcements.");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await marketplaceApi.getVendorAnnouncements(token);
        setAnnouncements(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, setError]);

  return (
    <section className="grid gap-6">
      <div>
        <div className="eyebrow">Vendor</div>
        <h1 className="page-title">Announcements</h1>
        <p className="section-copy">Messages from marketplace admins about your store, operations, or platform-wide updates.</p>
      </div>

      {error ? <div className="card section small">{error}</div> : null}

      {loading ? (
        <div className="card section small">Loading announcements...</div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((item) => (
            <article key={item._id} className="glass-card p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {item.audience === "all" ? "Marketplace wide" : "Vendor notice"}
                </span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${item.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {item.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>

              <h2 className="mt-3 text-xl font-semibold text-ink">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.message}</p>

              <div className="mt-4 grid gap-1 text-xs text-slate-500">
                <div>Starts: {formatDate(item.startsAt)}</div>
                <div>Ends: {formatDate(item.endsAt)}</div>
                <div>Published: {formatDate(item.createdAt)}</div>
              </div>
            </article>
          ))}

          {!announcements.length ? <div className="card section small">No announcements available for your store.</div> : null}
        </div>
      )}
    </section>
  );
}
