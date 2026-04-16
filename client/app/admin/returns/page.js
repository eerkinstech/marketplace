"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const STATUS_OPTIONS = ["requested", "approved", "rejected", "received", "refunded"];

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

function DetailModal({ row, draftStatus, setDraftStatus, statusNote, setStatusNote, saving, onClose, onSave }) {
  if (!row) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Return Detail</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-900">{row.product?.name || "Deleted product"}</h2>
            <p className="mt-2 text-sm text-slate-500">Vendor: {row.vendorLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">Close</button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer</div>
              <div className="mt-2 text-sm text-slate-700">{row.customerName}</div>
              <div className="mt-1 text-sm text-slate-600">{row.customerEmail}</div>
              <div className="mt-1 text-sm text-slate-600">{row.customerPhone}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dates</div>
              <div className="mt-2 text-sm text-slate-700">Order date: {formatDate(row.orderDate)}</div>
              <div className="mt-1 text-sm text-slate-600">Requested: {formatDate(row.createdAt)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reason</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{row.reason}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current Status</div>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>{row.status}</span>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Update Status</label>
              <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} rows={4} placeholder="Status note" className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <button type="button" onClick={onSave} disabled={saving} className="mt-3 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
                {saving ? "Saving..." : "Save Status"}
              </button>
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

export default function AdminReturnsPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage returns.");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [draftStatus, setDraftStatus] = useState("requested");
  const [statusNote, setStatusNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      const response = await marketplaceApi.getAdminReturns(token);
      setRows(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  function openModal(row) {
    setSelectedReturn(row);
    setDraftStatus(row.status || "requested");
    setStatusNote(row.statusNote || "");
  }

  async function saveStatus() {
    if (!selectedReturn) return;
    try {
      setSaving(true);
      const response = await marketplaceApi.updateAdminReturnStatus(token, selectedReturn._id, { status: draftStatus, statusNote });
      const updated = response.data;
      setRows((current) => current.map((row) => (row._id === updated._id ? updated : row)));
      setSelectedReturn(updated);
      setNotice("Return status updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Admin</div>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-slate-900">Return Requests</h1>
        <p className="mt-2 text-sm text-slate-500">See all vendor returns and marketplace-owned product returns in one place.</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">Loading returns...</div>
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-4 pr-4 font-semibold text-slate-900">{row.product?.name || "Deleted product"}</td>
                    <td className="py-4 px-4 text-slate-600">{row.vendorLabel}</td>
                    <td className="py-4 px-4 text-slate-600">{row.customerName}</td>
                    <td className="py-4 px-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>{row.status}</span></td>
                    <td className="py-4 pl-4"><button type="button" onClick={() => openModal(row)} className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No return requests found.</div>
        )}
      </div>

      <DetailModal
        row={selectedReturn}
        draftStatus={draftStatus}
        setDraftStatus={setDraftStatus}
        statusNote={statusNote}
        setStatusNote={setStatusNote}
        saving={saving}
        onClose={() => setSelectedReturn(null)}
        onSave={saveStatus}
      />
    </section>
  );
}
