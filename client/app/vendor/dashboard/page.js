"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { MetricCard } from "@/components/shared/MetricCard";

const quickLinks = [
  { href: "/vendor/products/new", label: "Add product" },
  { href: "/vendor/orders", label: "Review orders" },
  { href: "/vendor/inventory", label: "Manage inventory" },
  { href: "/vendor/shipping", label: "Shipping" }
];

export default function VendorDashboardPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to access this dashboard.");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const response = await marketplaceApi.getVendorDashboard(token);
        setDashboard(response.data);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [token, setError]);

  const metrics = dashboard?.metrics;
  const revenue = Number(metrics?.revenue || 0).toFixed(2);
  const lowStock = Array.isArray(dashboard?.inventorySnapshot)
    ? dashboard.inventorySnapshot.filter((item) => Number(item.stock || 0) < 10).length
    : 0;

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <div className="rounded-[28px] border border-black/5 bg-white/75 p-8 shadow-soft backdrop-blur-md">
          <div className="eyebrow">Vendor operations</div>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink">Store dashboard</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Track your product approvals, fulfill current orders, manage inventory depth, and stay on top of support activity from a single workspace.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full bg-[#ea580c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c2410c]">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] bg-[#132033] p-8 text-white shadow-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Store status</div>
          <div className="mt-4 space-y-4 text-sm text-white/80">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">Pending approvals</div>
              <div className="mt-2 text-3xl font-bold text-white">{metrics?.pendingProducts ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">Low-stock SKUs</div>
              <div className="mt-2 text-3xl font-bold text-white">{lowStock}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">Support state</div>
              <div className="mt-2 text-sm leading-6 text-white/80">Chat, reviews, and returns stay grouped inside the vendor workspace so store operators can resolve fulfillment issues without switching tools.</div>
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div> : null}

      {metrics ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Products" value={metrics.productCount} />
          <MetricCard label="Orders" value={metrics.orderCount} />
          <MetricCard label="Revenue" value={`$${revenue}`} />
          <MetricCard label="Reviews" value={metrics.reviewCount} />
          <MetricCard label="Pending" value={metrics.pendingProducts} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-black/5 bg-white/75 p-7 shadow-soft backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="eyebrow">Fulfillment</div>
              <h2 className="mt-2 text-2xl font-bold text-ink">Operations checklist</h2>
            </div>
            <Link href="/vendor/orders" className="text-sm font-semibold text-[#ea580c]">Open orders</Link>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-black/5 bg-white/80 p-4">Review new paid orders and update vendor shipment item statuses.</div>
            <div className="rounded-2xl border border-black/5 bg-white/80 p-4">Check inventory thresholds before promoted items go out of stock.</div>
            <div className="rounded-2xl border border-black/5 bg-white/80 p-4">Resolve return requests and customer messages from the same workspace.</div>
          </div>
        </div>

        <div className="rounded-[28px] border border-black/5 bg-white/75 p-7 shadow-soft backdrop-blur-md">
          <div className="eyebrow">Performance</div>
          <h2 className="mt-2 text-2xl font-bold text-ink">Commercial snapshot</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-[#fff8f1] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Net ready items</div>
              <div className="mt-2 text-3xl font-bold text-ink">{metrics?.productCount ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-[#eef6ff] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Orders handled</div>
              <div className="mt-2 text-3xl font-bold text-ink">{metrics?.orderCount ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-[#f5f3ff] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Revenue booked</div>
              <div className="mt-2 text-3xl font-bold text-ink">${revenue}</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-[#f0fdf4] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review count</div>
              <div className="mt-2 text-3xl font-bold text-ink">{metrics?.reviewCount ?? 0}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
