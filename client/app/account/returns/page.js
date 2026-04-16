"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { tokenStore } from "@/lib/auth/token-store";
import { AccountQuickLinks } from "@/components/account/AccountQuickLinks";

function formatDate(value) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function statusClasses(status) {
  const map = {
    requested: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    received: "bg-blue-100 text-blue-700",
    refunded: "bg-slate-100 text-slate-700"
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

function ReturnDetailModal({ row, onClose }) {
  if (!row) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b07a3f]">Your Return</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-900">{row.product?.name || "Deleted product"}</h2>
            <p className="mt-2 text-sm text-slate-500">Vendor: {row.vendorLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">Close</button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dates</div>
              <div className="mt-2 text-sm text-slate-700">Order date: {formatDate(row.orderDate)}</div>
              <div className="mt-1 text-sm text-slate-600">Requested: {formatDate(row.createdAt)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reason</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{row.reason}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status Note</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{row.statusNote || "No note added yet."}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</div>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>{row.status}</span>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Proof</div>
              {row.proofUrl ? <img src={row.proofUrl} alt="Return proof" className="mt-3 h-52 w-full rounded-2xl object-cover" /> : <p className="mt-2 text-sm text-slate-500">No proof uploaded.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountReturnsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const token = tokenStore.get();
        if (!token) {
          setError("Login first to view your return requests.");
          return;
        }

        const response = await marketplaceApi.getCustomerReturns(token);
        setRows(response.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="container page-section stack">
      <div>
        <div className="kicker">Customer account</div>
        <h1 className="page-title">Your return requests</h1>
      </div>
      <AccountQuickLinks />

      {error ? <div className="card section small">{error}</div> : null}

      <div className="glass-card overflow-x-auto p-6">
        {loading ? (
          <div className="text-sm text-slate-500">Loading return requests...</div>
        ) : rows.length ? (
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-slate-500">
                <th className="px-3 py-3 text-left font-medium">Product</th>
                <th className="px-3 py-3 text-left font-medium">Vendor</th>
                <th className="px-3 py-3 text-left font-medium">Order Date</th>
                <th className="px-3 py-3 text-left font-medium">Status</th>
                <th className="px-3 py-3 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-b border-black/10 last:border-b-0">
                  <td className="px-3 py-3 align-top text-ink">{row.product?.name || "Deleted product"}</td>
                  <td className="px-3 py-3 align-top text-ink">{row.vendorLabel}</td>
                  <td className="px-3 py-3 align-top text-ink">{formatDate(row.orderDate)}</td>
                  <td className="px-3 py-3 align-top text-ink">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>{row.status}</span>
                  </td>
                  <td className="px-3 py-3 align-top text-ink">
                    <button type="button" onClick={() => setSelectedReturn(row)} className="btn-secondary !px-4 !py-2">View details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-sm text-slate-500">No return requests found.</div>
        )}
      </div>

      <ReturnDetailModal row={selectedReturn} onClose={() => setSelectedReturn(null)} />
    </section>
  );
}
