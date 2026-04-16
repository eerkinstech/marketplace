"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { tokenStore } from "@/lib/auth/token-store";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  productId: "",
  orderDate: "",
  proof: "",
  reason: ""
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatError(err) {
  if (!err?.details) return err?.message || "Unable to submit return request.";

  const fieldErrors = Object.values(err.details)
    .flat()
    .filter(Boolean);

  return fieldErrors.length ? fieldErrors.join(" ") : (err.message || "Unable to submit return request.");
}

export default function ReturnsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [proofName, setProofName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const productsResponse = await marketplaceApi.getProducts("?limit=200");
        setProducts(productsResponse?.data?.items || []);

        const token = tokenStore.get();
        if (token) {
          const profileResponse = await marketplaceApi.getAuthProfile(token);
          const profile = profileResponse?.data || {};
          setForm((current) => ({
            ...current,
            name: profile.name || current.name,
            email: profile.email || current.email,
            phone: profile.phone || current.phone
          }));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleProofChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setProofName("");
      setForm((current) => ({ ...current, proof: "" }));
      return;
    }

    try {
      const proof = await fileToDataUrl(file);
      setProofName(file.name);
      setForm((current) => ({ ...current, proof }));
    } catch {
      setError("Unable to read the selected proof file.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitted(false);

    try {
      setSubmitting(true);
      const token = tokenStore.get();
      await marketplaceApi.createReturnRequest(form, token);
      setNotice("Return request submitted successfully.");
      setSubmitted(true);
      setForm((current) => ({
        ...initialForm,
        name: current.name,
        email: current.email,
        phone: current.phone
      }));
      setProofName("");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-[linear-gradient(180deg,#f6efe8_0%,#fbf7f2_100%)] py-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[32px] border border-[#e7ddd0] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#b07a3f]">Returns</div>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-900">Request a Return</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Fill out the return form with your contact details, product, order date, proof, and reason. The request is sent to the vendor who owns the product, and admin can review it too.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f7f3ec] p-4">
              <div className="text-sm font-semibold text-slate-900">Review flow</div>
              <p className="mt-2 text-sm text-slate-600">Vendors receive the request directly. Admin can see all vendor returns and marketplace-owned returns.</p>
            </div>
            <div className="rounded-2xl bg-[#f7f3ec] p-4">
              <div className="text-sm font-semibold text-slate-900">Proof</div>
              <p className="mt-2 text-sm text-slate-600">Upload a photo or screenshot that supports your return request.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[32px] border border-[#e7ddd0] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h2 className="text-3xl font-black tracking-[-0.03em] text-slate-900">Return Form</h2>
          <p className="mt-3 text-sm text-slate-500">Submit one request per product.</p>

          {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {notice ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}

          {submitted ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
                {notice || "Return request submitted successfully."}
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => { setSubmitted(false); setNotice(""); }} className="rounded-2xl bg-[#137a57] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#0f6849]">
                  Submit Another Return
                </button>
                <Link href="/account/returns" className="rounded-2xl border border-slate-300 px-6 py-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50">
                  Return Page
                </Link>
              </div>
            </div>
          ) : loading ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">Loading form...</div>
          ) : (
            <div className="mt-8 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1d5c54] focus:ring-2 focus:ring-[#d7ece7]" />
                <input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1d5c54] focus:ring-2 focus:ring-[#d7ece7]" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input required value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1d5c54] focus:ring-2 focus:ring-[#d7ece7]" />
                <input required type="date" value={form.orderDate} onChange={(event) => setForm((current) => ({ ...current, orderDate: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1d5c54] focus:ring-2 focus:ring-[#d7ece7]" />
              </div>

              <select required value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1d5c54] focus:ring-2 focus:ring-[#d7ece7]">
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} {product.vendor?.storeName ? `- ${product.vendor.storeName}` : ""}
                  </option>
                ))}
              </select>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <label className="block text-sm font-semibold text-slate-900">Proof</label>
                <input type="file" accept="image/*" onChange={handleProofChange} className="mt-3 block w-full text-sm text-slate-600" />
                <p className="mt-2 text-xs text-slate-500">{proofName || "Upload a proof image if available."}</p>
              </div>

              <textarea required minLength={10} rows={6} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Reason / Description" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1d5c54] focus:ring-2 focus:ring-[#d7ece7]" />

              <button type="submit" disabled={submitting} className="mt-2 rounded-2xl bg-[#137a57] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#0f6849] disabled:opacity-60">
                {submitting ? "Submitting..." : "Submit Return Request"}
              </button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
