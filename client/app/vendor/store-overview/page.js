"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));
}

function formatAddress(profile) {
  return [profile?.addressLine, profile?.city, profile?.state, profile?.country, profile?.postalCode]
    .filter(Boolean)
    .join(", ");
}

export default function VendorStoreOverviewPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to view your store overview.");
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [profileResponse, dashboardResponse, announcementsResponse] = await Promise.all([
          marketplaceApi.getVendorProfile(token),
          marketplaceApi.getVendorDashboard(token),
          marketplaceApi.getVendorAnnouncements(token)
        ]);

        if (ignore) return;

        setProfile(profileResponse?.data || null);
        setDashboard(dashboardResponse?.data || null);
        setAnnouncements(Array.isArray(announcementsResponse?.data) ? announcementsResponse.data.slice(0, 3) : []);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [token, setError]);

  const metrics = useMemo(() => {
    const stats = dashboard?.metrics || {};
    return [
      { label: "Products", value: stats.productCount ?? 0 },
      { label: "Orders", value: stats.orderCount ?? 0 },
      { label: "Revenue", value: formatMoney(stats.revenue || 0) },
      { label: "Reviews", value: stats.reviewCount ?? 0 }
    ];
  }, [dashboard]);

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="rounded-[28px] border border-black/5 bg-white/78 p-8 shadow-soft backdrop-blur-md">
          <div className="eyebrow">Vendor</div>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink">Store overview</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Review your public store identity, operational status, and current marketplace communication from one page.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/vendor/settings" className="rounded-full bg-[#0f766e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c5c56]">
              Edit store settings
            </Link>
            <Link href="/vendor/products" className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50">
              Manage products
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] bg-[#132033] p-8 text-white shadow-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Store status</div>
          <div className="mt-4 space-y-4 text-sm text-white/80">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">Approval state</div>
              <div className="mt-2 text-3xl font-bold text-white capitalize">{profile?.status || "active"}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">Store slug</div>
              <div className="mt-2 text-sm break-all text-white/90">/{profile?.storeSlug || "not-set"}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">Marketplace notices</div>
              <div className="mt-2 text-3xl font-bold text-white">{announcements.length}</div>
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-[24px] border border-dashed border-black/10 px-4 py-12 text-center text-sm text-slate-500">
          Loading store overview...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-[24px] border border-black/5 bg-white/75 p-6 shadow-soft backdrop-blur-md">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</div>
                <div className="mt-3 text-3xl font-bold text-ink">{metric.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-[28px] border border-black/5 bg-white/78 p-7 shadow-soft backdrop-blur-md">
              <div className="eyebrow">Identity</div>
              <h2 className="mt-2 text-2xl font-bold text-ink">Store profile</h2>

              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="h-24 w-24 overflow-hidden rounded-[24px] border border-black/8 bg-[#f4ede4]">
                  {profile?.storeLogo ? <img src={profile.storeLogo} alt="Store logo" className="h-full w-full object-cover" /> : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-bold text-ink">{profile?.storeName || "Store name not set"}</div>
                  <div className="mt-2 text-sm text-slate-600">{profile?.email || "No email available"}</div>
                  <div className="mt-1 text-sm text-slate-600">{profile?.phone || "No phone number saved"}</div>
                  <div className="mt-3 text-sm text-slate-500">{formatAddress(profile) || "No business address saved yet."}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-black/5 bg-white/78 p-7 shadow-soft backdrop-blur-md">
              <div className="eyebrow">Operations</div>
              <h2 className="mt-2 text-2xl font-bold text-ink">Checklist</h2>
              <div className="mt-5 grid gap-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-black/5 bg-white/80 p-4">Keep store branding and contact information updated before campaign pushes.</div>
                <div className="rounded-2xl border border-black/5 bg-white/80 p-4">Review admin announcements regularly for fulfillment, policy, or scheduling updates.</div>
                <div className="rounded-2xl border border-black/5 bg-white/80 p-4">Monitor product approvals and inventory so your storefront stays ready for demand.</div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/5 bg-white/78 p-7 shadow-soft backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="eyebrow">Announcements</div>
                <h2 className="mt-2 text-2xl font-bold text-ink">Recent admin notices</h2>
              </div>
              <Link href="/vendor/announcements" className="text-sm font-semibold text-[#ea580c]">
                View all
              </Link>
            </div>

            <div className="mt-5 grid gap-4">
              {announcements.length ? announcements.map((item) => (
                <article key={item._id} className="rounded-2xl border border-black/6 bg-white/80 p-5">
                  <div className="text-sm font-semibold text-ink">{item.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{item.message}</div>
                </article>
              )) : (
                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-slate-500">
                  No recent announcements for your store.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
