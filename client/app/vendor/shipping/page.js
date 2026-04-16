"use client";

import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const emptyRule = () => ({
  minWeight: "",
  maxWeight: "",
  minPrice: "",
  maxPrice: "",
  rate: "",
  isFreeShipping: false
});

const initialForm = {
  name: "",
  estimatedDays: "",
  isActive: true,
  rules: [emptyRule()]
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(Number(value || 0));
}

function formatWeight(product) {
  if (product.hasVariantWeights) {
    if (product.minVariantWeight === product.maxVariantWeight) return `${product.minVariantWeight} kg (variant)`;
    return `${product.minVariantWeight} - ${product.maxVariantWeight} kg (variants)`;
  }
  return Number(product.weight || 0) > 0 ? `${product.weight} kg` : "Not set";
}

function formatPrice(product) {
  if (product.minVariantPrice != null && product.maxVariantPrice != null) {
    if (product.minVariantPrice === product.maxVariantPrice) return `${formatCurrency(product.minVariantPrice)} (variant)`;
    return `${formatCurrency(product.minVariantPrice)} - ${formatCurrency(product.maxVariantPrice)} (variants)`;
  }
  return Number(product.price || 0) > 0 ? formatCurrency(product.price) : "Not set";
}

function formatPreview(preview) {
  if (!preview) return "Not ready";
  if (preview.minRate == null || preview.maxRate == null) return preview.label || "Not ready";
  if (preview.minRate === 0 && preview.maxRate === 0) return `${preview.label} • Free`;
  if (preview.minRate === preview.maxRate) return `${preview.label} • ${formatCurrency(preview.minRate)}`;
  return `${preview.label} • ${formatCurrency(preview.minRate)} - ${formatCurrency(preview.maxRate)}`;
}

function formatRule(rule) {
  const parts = [];
  if (rule.minWeight !== null || rule.maxWeight !== null) {
    parts.push(`Weight ${rule.minWeight ?? 0}kg to ${rule.maxWeight ?? "above"}kg`);
  }
  if (rule.minPrice !== null || rule.maxPrice !== null) {
    parts.push(`Price ${formatCurrency(rule.minPrice ?? 0)} to ${rule.maxPrice != null ? formatCurrency(rule.maxPrice) : "above"}`);
  }
  parts.push(rule.isFreeShipping ? "Free shipping" : formatCurrency(rule.rate));
  return parts.join(" • ");
}

export default function VendorShippingPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to manage shipping.");
  const [data, setData] = useState({ areas: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [notice, setNotice] = useState("");
  const [editingAreaId, setEditingAreaId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState([]);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      const response = await marketplaceApi.getVendorShippingManagement(token);
      setData(response.data || { areas: [], products: [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const stats = useMemo(() => ({
    totalAreas: data.areas.length,
    totalRules: data.areas.reduce((sum, area) => sum + (area.rules?.length || 0), 0),
    freeRules: data.areas.reduce((sum, area) => sum + (area.rules || []).filter((rule) => rule.isFreeShipping).length, 0),
    assignedProducts: data.products.filter((product) => product.shippingAreas?.length).length
  }), [data]);

  const allProductsSelected = data.products.length > 0 && selectedProductIds.length === data.products.length;

  function startEdit(area) {
    setEditingAreaId(area._id);
    setForm({
      name: area.name || "",
      estimatedDays: area.estimatedDays || "",
      isActive: Boolean(area.isActive),
      rules: (area.rules?.length ? area.rules : [emptyRule()]).map((rule) => ({
        minWeight: rule.minWeight ?? "",
        maxWeight: rule.maxWeight ?? "",
        minPrice: rule.minPrice ?? "",
        maxPrice: rule.maxPrice ?? "",
        rate: rule.rate ?? "",
        isFreeShipping: Boolean(rule.isFreeShipping)
      }))
    });
  }

  function resetForm() {
    setEditingAreaId("");
    setForm(initialForm);
  }

  function updateRule(index, field, value) {
    setForm((current) => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) => (
        ruleIndex === index ? { ...rule, [field]: value } : rule
      ))
    }));
  }

  function addRule() {
    setForm((current) => ({ ...current, rules: [...current.rules, emptyRule()] }));
  }

  function removeRule(index) {
    setForm((current) => ({
      ...current,
      rules: current.rules.length === 1 ? [emptyRule()] : current.rules.filter((_, ruleIndex) => ruleIndex !== index)
    }));
  }

  async function saveArea(event) {
    event.preventDefault();
    const normalizedRules = form.rules.map((rule) => ({
      minWeight: rule.minWeight === "" ? null : Number(rule.minWeight),
      maxWeight: rule.maxWeight === "" ? null : Number(rule.maxWeight),
      minPrice: rule.minPrice === "" ? null : Number(rule.minPrice),
      maxPrice: rule.maxPrice === "" ? null : Number(rule.maxPrice),
      rate: rule.isFreeShipping ? 0 : Number(rule.rate || 0),
      isFreeShipping: Boolean(rule.isFreeShipping)
    }));

    if (!form.name.trim()) {
      setError("Shipping name is required.");
      return;
    }

    if (normalizedRules.some((rule) => (
      rule.minWeight === null
      && rule.maxWeight === null
      && rule.minPrice === null
      && rule.maxPrice === null
    ))) {
      setError("Each rule must use weight, price, or both.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name,
        estimatedDays: form.estimatedDays,
        isActive: form.isActive,
        rules: normalizedRules
      };
      if (editingAreaId) {
        await marketplaceApi.updateVendorShippingArea(token, editingAreaId, payload);
        setNotice("Shipping setup updated.");
      } else {
        await marketplaceApi.createVendorShippingArea(token, payload);
        setNotice("Shipping setup created.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeArea(id) {
    try {
      await marketplaceApi.deleteVendorShippingArea(token, id);
      setNotice("Shipping setup deleted.");
      if (editingAreaId === id) resetForm();
      setSelectedAreaIds((current) => current.filter((entry) => entry !== String(id)));
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleProduct(id) {
    setSelectedProductIds((current) =>
      current.includes(String(id))
        ? current.filter((entry) => entry !== String(id))
        : [...current, String(id)]
    );
  }

  function toggleAllProducts() {
    setSelectedProductIds(allProductsSelected ? [] : data.products.map((product) => String(product._id)));
  }

  function toggleArea(id) {
    setSelectedAreaIds((current) =>
      current.includes(String(id))
        ? current.filter((entry) => entry !== String(id))
        : [...current, String(id)]
    );
  }

  async function bulkAssign() {
    if (!selectedProductIds.length) {
      setError("Select at least one product.");
      return;
    }

    try {
      setAssigning(true);
      await Promise.all(
        selectedProductIds.map((productId) =>
          marketplaceApi.assignVendorShippingAreas(token, productId, { shippingAreaIds: selectedAreaIds })
        )
      );
      setNotice("Shipping assigned to selected products.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Shipping Management</h1>
        <p className="mt-2 text-slate-600">Create shipping names with weight rules, price rules, free shipping, or combined conditions.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{notice}</div> : null}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">Loading shipping settings...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-600">Shipping Names</p><p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalAreas}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-600">Rules</p><p className="mt-2 text-3xl font-bold text-emerald-600">{stats.totalRules}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-600">Free Shipping Rules</p><p className="mt-2 text-3xl font-bold text-blue-600">{stats.freeRules}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-600">Assigned Products</p><p className="mt-2 text-3xl font-bold text-slate-900">{stats.assignedProducts}</p></div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
            <form onSubmit={saveArea} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">{editingAreaId ? "Edit Shipping Name" : "Create Shipping Name"}</h2>
                {editingAreaId ? <button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-500 hover:text-slate-900">Cancel edit</button> : null}
              </div>

              <div className="mt-6 grid gap-4">
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Shipping name" className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                <input value={form.estimatedDays} onChange={(event) => setForm((current) => ({ ...current, estimatedDays: event.target.value }))} placeholder="ETA, for example 2-4 business days" className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
                  Shipping is active
                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Rules</div>
                      <p className="mt-1 text-xs text-slate-500">Leave unused fields empty. Use free shipping when the rule should charge zero.</p>
                    </div>
                    <button type="button" onClick={addRule} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white">Add rule</button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {form.rules.map((rule, index) => (
                      <div key={`rule-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-2">
                          <input type="number" min="0" step="0.01" value={rule.minWeight} onChange={(event) => updateRule(index, "minWeight", event.target.value)} placeholder="Min weight (kg)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                          <input type="number" min="0" step="0.01" value={rule.maxWeight} onChange={(event) => updateRule(index, "maxWeight", event.target.value)} placeholder="Max weight (kg)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                          <input type="number" min="0" step="0.01" value={rule.minPrice} onChange={(event) => updateRule(index, "minPrice", event.target.value)} placeholder="Min price" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                          <input type="number" min="0" step="0.01" value={rule.maxPrice} onChange={(event) => updateRule(index, "maxPrice", event.target.value)} placeholder="Max price" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                          <input type="number" min="0" step="0.01" value={rule.rate} onChange={(event) => updateRule(index, "rate", event.target.value)} placeholder="Rate" disabled={rule.isFreeShipping} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100" />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={rule.isFreeShipping} onChange={(event) => updateRule(index, "isFreeShipping", event.target.checked)} />
                            Free shipping
                          </label>
                          <button type="button" onClick={() => removeRule(index)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={saving} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60">
                  {saving ? "Saving..." : editingAreaId ? "Update shipping" : "Create shipping"}
                </button>
              </div>
            </form>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Shipping Names</h2>
              <div className="mt-5 space-y-4">
                {data.areas.length ? data.areas.map((area) => (
                  <div key={area._id} className="rounded-xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{area.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">ETA: {area.estimatedDays || "N/A"}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${area.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {area.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      {(area.rules || []).map((rule, index) => (
                        <div key={`${area._id}-rule-${index}`} className="rounded-lg bg-slate-50 px-3 py-2">
                          {formatRule(rule)}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => startEdit(area)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                      <button type="button" onClick={() => removeArea(area._id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">Delete</button>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No shipping names created yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Bulk Assign Products</h2>
                <p className="mt-1 text-sm text-slate-500">Rates now support weight, price, combined weight and price, plus free shipping conditions.</p>
              </div>
              <button type="button" onClick={bulkAssign} disabled={assigning} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60">
                {assigning ? "Assigning..." : "Assign Selected"}
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-700">Select Shipping Names</div>
              <div className="mt-3 flex flex-wrap gap-4">
                {data.areas.length ? data.areas.map((area) => (
                  <label key={area._id} className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={selectedAreaIds.includes(String(area._id))} onChange={() => toggleArea(area._id)} />
                    {area.name}
                  </label>
                )) : <span className="text-sm text-slate-500">No shipping names available.</span>}
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-3 pr-4"><input type="checkbox" checked={allProductsSelected} onChange={toggleAllProducts} /></th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Effective Weight</th>
                    <th className="py-3 px-4">Effective Price</th>
                    <th className="py-3 px-4">Matched Rate</th>
                    <th className="py-3 pl-4">Current Shipping</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.length ? data.products.map((product) => (
                    <tr key={product._id} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-4 pr-4"><input type="checkbox" checked={selectedProductIds.includes(String(product._id))} onChange={() => toggleProduct(product._id)} /></td>
                      <td className="py-4 px-4 font-semibold text-slate-900">{product.name}</td>
                      <td className="py-4 px-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{product.status}</span></td>
                      <td className="py-4 px-4 text-slate-600">{formatWeight(product)}</td>
                      <td className="py-4 px-4 text-slate-600">{formatPrice(product)}</td>
                      <td className="py-4 px-4 text-slate-600">{formatPreview(product.shippingPreview)}</td>
                      <td className="py-4 pl-4 text-slate-600">{(product.shippingAreas || []).map((area) => area.name).join(", ") || "Not assigned"}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="8" className="py-10 text-center text-slate-500">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
