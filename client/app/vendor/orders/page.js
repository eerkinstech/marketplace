"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const FILTERS = [
  { key: "all", label: "All items" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "refunded", label: "Refunded" }
];

function formatMoney(value) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(value || 0));
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A";
}

function formatLabel(value = "") {
  return String(value || "pending")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function tone(status = "") {
  const normalized = String(status).toLowerCase();
  if (normalized === "delivered") return "bg-emerald-100 text-emerald-800";
  if (normalized === "shipped") return "bg-teal-100 text-teal-800";
  if (normalized === "processing") return "bg-slate-200 text-slate-700";
  if (normalized === "refunded" || normalized === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-800";
}

function itemMeta(item = {}) {
  if (item.variantLabel) return item.variantLabel;

  const entries = Object.entries(item.optionValues || {}).filter(([, value]) => value);
  if (!entries.length) return "Default variant";

  return entries.map(([key, value]) => `${key}: ${value}`).join(" / ");
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5" />
      <path d="M8 15h2a1.5 1.5 0 0 0 0-3H8v6" />
      <path d="M14 18h1.2a2.8 2.8 0 1 0 0-5.6H14V18z" />
      <path d="M18 12h-2v6" />
      <path d="M18 15h-1.5" />
    </svg>
  );
}

export default function VendorOrdersPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to manage orders.");
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingKey, setUpdatingKey] = useState("");

  async function load() {
    if (!token) return;
    try {
      const response = await marketplaceApi.getVendorOrders(token);
      setOrders(response.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function setStatus(orderId, productId, status) {
    try {
      setUpdatingKey(`${orderId}:${productId}:${status}`);
      await marketplaceApi.updateVendorOrderStatus(token, { orderId, productId, status });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingKey("");
    }
  }

  const rows = useMemo(
    () =>
      orders.flatMap((order) =>
        (order.items || []).map((item, index) => ({
          ...item,
          rowKey: `${order._id}:${item.product}:${index}`,
          orderId: order._id,
          orderStatus: order.status,
          paymentStatus: order.paymentStatus,
          orderTotal: order.totalAmount,
          customerName: order.customerName || order.shippingAddress?.fullName || "Customer",
          customerEmail: order.customerEmail || "No email",
          createdAt: order.createdAt
        }))
      ),
    [orders]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesFilter = activeFilter === "all" || String(row.status).toLowerCase() === activeFilter;
      if (!matchesFilter) return false;
      if (!query) return true;

      return [
        row.orderId,
        row.name,
        row.customerName,
        row.customerEmail,
        row.variantSku,
        row.variantLabel
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [activeFilter, rows, search]);

  const metrics = useMemo(() => {
    const itemCount = rows.length;
    const revenue = rows.reduce((sum, row) => sum + Number(row.price || 0) * Number(row.quantity || 0), 0);
    const openItems = rows.filter((row) => ["pending", "processing"].includes(row.status)).length;
    const shippedItems = rows.filter((row) => row.status === "shipped").length;

    return [
      { label: "Items", value: itemCount, detail: "Vendor order lines" },
      { label: "Open", value: openItems, detail: "Pending and processing" },
      { label: "Shipped", value: shippedItems, detail: "Items in transit" },
      { label: "Revenue", value: formatMoney(revenue), detail: "Vendor-side line totals" }
    ];
  }, [rows]);

  return (
    <section className="container page-section stack">
      <div className="card page-hero grid gap-8">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Vendor</div>
            <h1 className="page-title mt-3">Order management</h1>
            <p className="muted-copy mt-4 max-w-3xl">
              Manage your order items with the same structured management layout used in Marketplace admin, adapted to vendor fulfillment data.
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={load}>
            Refresh orders
          </button>
        </div>

        <div className="metric-grid">
          {metrics.map((metric) => (
            <div key={metric.label} className="stat-chip">
              <div className="mini-label">{metric.label}</div>
              <div className="mt-3 text-3xl font-semibold text-ink">{metric.value}</div>
              <div className="mt-2 text-sm text-slate-600">{metric.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {error ? <div className="card section small">{error}</div> : null}

      <div className="card section grid gap-6">
        <div className="">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={activeFilter === filter.key ? "btn-primary" : "btn-secondary"}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="field-input mt-5 max-w-xl"
            placeholder="Search by order id, customer, product, or SKU"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded-[28px] border border-black/8 bg-white/70">
          <table className="table">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.18em] text-slate-500">

                <th>Customer</th>
                <th>Qty</th>
                <th>Line total</th>
                <th>Processing</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length ? (
                filteredRows.map((row) => (
                  <tr key={row.rowKey}>

                    <td>
                      <div className="text-sm font-semibold text-ink">{row.customerName}</div>
                      <div className="mt-1 text-xs text-slate-600">{row.customerEmail}</div>
                    </td>

                    <td className="text-sm font-semibold text-ink">{row.quantity}</td>
                    <td className="text-sm font-semibold text-ink">{formatMoney(Number(row.price || 0) * Number(row.quantity || 0))}</td>
                    <td>
                      <select
                        value={row.status}
                        onChange={(event) => setStatus(row.orderId, row.product, event.target.value)}
                        disabled={Boolean(updatingKey) && updatingKey.startsWith(`${row.orderId}:${row.product}:`)}
                        className="field-input min-w-[150px] !rounded-2xl !px-3 !py-2 !text-xs disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                    <td>
                      <Link
                        href={`/vendor/orders/${row.orderId}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-50"
                        title="Open order detail"
                      >
                        <PdfIcon />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-sm text-slate-500">
                    No vendor order items match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
