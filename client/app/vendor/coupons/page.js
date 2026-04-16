"use client";

import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const initialForm = {
    code: "",
    discountType: "percentage",
    discountValue: "0",
    minimumOrderAmount: "0",
    productId: "",
    maxUses: "",
    expiry: "",
    isActive: true
};

function formatMoney(value) {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP"
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return "No limit";
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function normalizeCoupon(coupon) {
    return {
        ...coupon,
        code: String(coupon?.code || "").toUpperCase(),
        discountType: coupon?.discountType || "percentage",
        discountValue: Number(coupon?.discountValue || 0),
        minimumOrderAmount: Number(coupon?.minimumOrderAmount || 0),
        maxUses: coupon?.maxUses ?? "",
        usedCount: Number(coupon?.usedCount || 0),
        expiry: coupon?.expiry || "",
        productId: coupon?.productId || "",
        isActive: coupon?.isActive !== false
    };
}

function isExpiredByDate(coupon) {
    if (!coupon?.expiry) return false;
    return new Date(coupon.expiry) < new Date();
}

function isExpiredByUsage(coupon) {
    return Number(coupon?.maxUses || 0) > 0 && Number(coupon?.usedCount || 0) >= Number(coupon?.maxUses || 0);
}

function getStatusMeta(coupon) {
    if (!coupon.isActive) {
        return {
            label: "Inactive",
            className: "bg-slate-200 text-slate-700"
        };
    }

    if (isExpiredByDate(coupon)) {
        return {
            label: "Expired",
            className: "bg-rose-100 text-rose-700"
        };
    }

    if (isExpiredByUsage(coupon)) {
        return {
            label: "Limit Reached",
            className: "bg-amber-100 text-amber-800"
        };
    }

    return {
        label: "Active",
        className: "bg-emerald-100 text-emerald-700"
    };
}

function getUsagePercent(coupon) {
    if (!coupon.maxUses) return 0;
    return Math.min((Number(coupon.usedCount || 0) / Number(coupon.maxUses || 1)) * 100, 100);
}

function toFormState(coupon) {
    return {
        code: coupon.code || "",
        discountType: coupon.discountType || "percentage",
        discountValue: String(coupon.discountValue ?? 0),
        minimumOrderAmount: String(coupon.minimumOrderAmount ?? 0),
        productId: coupon.productId?._id || coupon.productId || "",
        maxUses: coupon.maxUses === "" || coupon.maxUses === null || coupon.maxUses === undefined ? "" : String(coupon.maxUses),
        expiry: coupon.expiry ? new Date(coupon.expiry).toISOString().split("T")[0] : "",
        isActive: coupon.isActive !== false
    };
}

function CouponModal({ editingCoupon, form, setForm, submitting, onClose, onSubmit, products }) {
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [productSearch, setProductSearch] = useState("");

    const productList = Array.isArray(products) ? products : [];

    const filteredProducts = productList.filter((p) =>
        p.title?.toLowerCase().includes(productSearch.toLowerCase()) || p.name?.toLowerCase().includes(productSearch.toLowerCase())
    );

    const selectedProduct = productList.find((p) => p._id === form.productId);
    const title = editingCoupon ? "Edit Coupon" : "Create New Coupon";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
                <div className="flex items-center justify-between border-b border-black/8 px-6 py-5">
                    <div>
                        <div className="eyebrow">Coupons</div>
                        <h2 className="mt-2 text-2xl font-bold text-ink">{title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Close coupon modal"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={onSubmit} className="grid gap-5 px-6 py-6">
                    <label className="grid gap-2">
                        <span className="text-sm font-semibold text-ink">Coupon Code *</span>
                        <input
                            name="code"
                            value={form.code}
                            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                            placeholder="SUMMER20"
                            className="field-input"
                            disabled={Boolean(editingCoupon)}
                            required
                        />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2">
                            <span className="text-sm font-semibold text-ink">Discount Type *</span>
                            <select
                                name="discountType"
                                value={form.discountType}
                                onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value }))}
                                className="field-input"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (£)</option>
                            </select>
                        </label>

                        <label className="grid gap-2">
                            <span className="text-sm font-semibold text-ink">Discount Value *</span>
                            <input
                                name="discountValue"
                                type="number"
                                min="0"
                                step={form.discountType === "percentage" ? "1" : "0.01"}
                                value={form.discountValue}
                                onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))}
                                placeholder={form.discountType === "percentage" ? "10" : "15.00"}
                                className="field-input"
                                required
                            />
                        </label>
                    </div>

                    <label className="grid gap-2 relative">
                        <span className="text-sm font-semibold text-ink">Select Product (Optional)</span>
                        <div
                            className="field-input p-0 cursor-pointer relative"
                            onClick={() => setShowProductDropdown(!showProductDropdown)}
                        >
                            <div className="px-4 py-2">
                                {selectedProduct?.title || selectedProduct?.name ? (
                                    <span className="text-ink">{selectedProduct.title || selectedProduct.name}</span>
                                ) : (
                                    <span className="text-slate-500">Select a product or leave blank for all your products</span>
                                )}
                            </div>
                        </div>

                        {showProductDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-black/8 rounded-lg shadow-lg max-h-48 overflow-hidden flex flex-col">
                                <div className="p-2 sticky top-0 bg-white border-b border-black/8">
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="field-input text-sm"
                                    />
                                </div>
                                <div className="overflow-y-auto min-h-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForm((current) => ({ ...current, productId: "" }));
                                            setShowProductDropdown(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 text-slate-700"
                                    >
                                        All Your Products
                                    </button>
                                    {filteredProducts.map((product) => (
                                        <button
                                            key={product._id}
                                            type="button"
                                            onClick={() => {
                                                setForm((current) => ({ ...current, productId: product._id }));
                                                setShowProductDropdown(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 text-slate-700"
                                        >
                                            {product.title || product.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </label>

                    <div className="grid gap-4 md:grid-cols-3">
                        <label className="grid gap-2">
                            <span className="text-sm font-semibold text-ink">Minimum Order</span>
                            <input
                                name="minimumOrderAmount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.minimumOrderAmount}
                                onChange={(event) => setForm((current) => ({ ...current, minimumOrderAmount: event.target.value }))}
                                placeholder="0.00"
                                className="field-input"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="text-sm font-semibold text-ink">Max Uses</span>
                            <input
                                name="maxUses"
                                type="number"
                                min="1"
                                value={form.maxUses}
                                onChange={(event) => setForm((current) => ({ ...current, maxUses: event.target.value }))}
                                placeholder="Unlimited"
                                className="field-input"
                            />
                        </label>

                        <label className="grid gap-2">
                            <span className="text-sm font-semibold text-ink">Expiry Date *</span>
                            <input
                                name="expiry"
                                type="date"
                                value={form.expiry}
                                onChange={(event) => setForm((current) => ({ ...current, expiry: event.target.value }))}
                                className="field-input"
                                required
                            />
                        </label>
                    </div>

                    <label className="inline-flex items-center gap-3 rounded-2xl border border-black/8 bg-slate-50 px-4 py-3 text-sm font-semibold text-ink">
                        <input
                            name="isActive"
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                        />
                        <span>Coupon is active</span>
                    </label>

                    <div className="flex flex-wrap justify-end gap-3 border-t border-black/8 pt-5">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
                            {submitting ? "Saving..." : editingCoupon ? "Update Coupon" : "Create Coupon"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function VendorCouponsPage() {
    const { token, error, setError } = useAccessToken("Login with a vendor account to manage coupons.");
    const [coupons, setCoupons] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState("");

    async function loadCoupons() {
        if (!token) return;

        try {
            setLoading(true);
            const response = await marketplaceApi.getVendorCoupons(token);
            setCoupons((response.data || []).map(normalizeCoupon));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadProducts() {
        if (!token) return;

        try {
            const response = await marketplaceApi.getVendorProductsList(token);
            setProducts(response.data || []);
        } catch (err) {
            console.error("Failed to load products:", err);
        }
    }

    useEffect(() => {
        loadCoupons();
        loadProducts();
    }, [token]);

    const filteredCoupons = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return coupons.filter((coupon) => {
            if (!query) return true;
            return coupon.code.toLowerCase().includes(query);
        });
    }, [coupons, searchQuery]);

    const metrics = useMemo(() => {
        const activeCoupons = coupons.filter((coupon) => getStatusMeta(coupon).label === "Active").length;
        const totalRedemptions = coupons.reduce((sum, coupon) => sum + Number(coupon.usedCount || 0), 0);
        const productCoupons = coupons.filter((coupon) => coupon.productId).length;

        return [
            { label: "Coupons", value: coupons.length, detail: "Your coupon codes" },
            { label: "Active", value: activeCoupons, detail: "Currently usable offers" },
            { label: "Redemptions", value: totalRedemptions, detail: "Total recorded coupon uses" },
            { label: "Product-Specific", value: productCoupons, detail: "Coupons assigned to products" }
        ];
    }, [coupons]);

    function resetForm() {
        setForm(initialForm);
        setEditingCoupon(null);
    }

    function openCreateModal() {
        resetForm();
        setShowModal(true);
    }

    function openEditModal(coupon) {
        setEditingCoupon(coupon);
        setForm(toFormState(coupon));
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        resetForm();
    }

    function buildPayload() {
        return {
            code: String(form.code || "").trim().toUpperCase(),
            discountType: form.discountType,
            discountValue: Number(form.discountValue || 0),
            minimumOrderAmount: Number(form.minimumOrderAmount || 0),
            expiry: form.expiry,
            maxUses: form.maxUses ? Number(form.maxUses) : undefined,
            productId: form.productId || undefined,
            isActive: Boolean(form.isActive)
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const payload = buildPayload();

        if (!payload.code) {
            setError("Coupon code is required.");
            return;
        }

        if (payload.discountType === "percentage" && (payload.discountValue <= 0 || payload.discountValue > 100)) {
            setError("Percentage discount must be between 1 and 100.");
            return;
        }

        if (payload.discountType === "fixed" && payload.discountValue <= 0) {
            setError("Fixed discount must be greater than 0.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            if (editingCoupon?._id) {
                await marketplaceApi.updateVendorCoupon(token, editingCoupon._id, payload);
            } else {
                await marketplaceApi.createVendorCoupon(token, payload);
            }

            closeModal();
            await loadCoupons();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(coupon) {
        if (!window.confirm(`Delete coupon ${coupon.code}?`)) {
            return;
        }

        try {
            setDeletingId(coupon._id);
            setError("");
            await marketplaceApi.deleteVendorCoupon(token, coupon._id);
            await loadCoupons();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId("");
        }
    }

    return (
        <section className="container page-section stack">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="eyebrow">Seller</div>
                    <h1 className="page-title mt-3">Coupon Management</h1>
                    <p className="muted-copy mt-3">Create and manage discount codes for your products.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={loadCoupons} className="btn-secondary">
                        <i className="fas fa-sync mr-2" />
                        Refresh
                    </button>
                    <button type="button" onClick={openCreateModal} className="btn-primary">
                        <i className="fas fa-plus mr-2" />
                        Create Coupon
                    </button>
                </div>
            </div>

            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <div className="metric-grid">
                {metrics.map((metric) => (
                    <div key={metric.label} className="card metric">
                        <p className="mini-label">{metric.label}</p>
                        <div className="mt-3 text-3xl font-bold text-ink">{metric.value}</div>
                        <p className="mt-2 text-sm text-slate-600">{metric.detail}</p>
                    </div>
                ))}
            </div>

            <div className="card section">
                <div className="relative max-w-md">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <i className="fas fa-search text-sm" />
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search coupons by code..."
                        className="field-input pl-11 pr-10"
                    />
                    {searchQuery ? (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 transition hover:text-slate-700"
                            aria-label="Clear coupon search"
                        >
                            <i className="fas fa-times text-sm" />
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="overflow-x-auto rounded-[28px] border border-black/8 bg-white shadow-[0_18px_48px_rgba(16,32,26,0.08)]">
                {loading ? (
                    <div className="px-6 py-16 text-center text-slate-500">Loading coupons...</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="border-b border-black/8 bg-slate-50/90">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Code</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Discount</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Minimum Order</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Usage</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Expiry</th>
                                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Status</th>
                                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCoupons.length ? (
                                filteredCoupons.map((coupon) => {
                                    const status = getStatusMeta(coupon);
                                    const usagePercent = getUsagePercent(coupon);
                                    const productName = typeof coupon.productId === "object" ? coupon.productId?.title || coupon.productId?.name : null;

                                    return (
                                        <tr key={coupon._id} className="border-b border-black/6 transition hover:bg-slate-50/70 last:border-b-0">
                                            <td className="px-4 py-4 font-mono font-bold text-slate-900">{coupon.code}</td>
                                            <td className="px-4 py-4 font-semibold text-slate-900">
                                                {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : formatMoney(coupon.discountValue)}
                                            </td>
                                         
                                            <td className="px-4 py-4 text-slate-700">{formatMoney(coupon.minimumOrderAmount)}</td>
                                            <td className="px-4 py-4 text-slate-700">
                                                {coupon.maxUses ? (
                                                    <div className="max-w-[150px]">
                                                        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                                                            <span>{coupon.usedCount}/{coupon.maxUses}</span>
                                                            <span>{Math.round(usagePercent)}%</span>
                                                        </div>
                                                        <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                                                            <div
                                                                className={`h-1.5 rounded-full ${isExpiredByUsage(coupon) ? "bg-rose-500" : "bg-emerald-500"}`}
                                                                style={{ width: `${usagePercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs italic text-slate-500">Unlimited</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-slate-700">{formatDate(coupon.expiry)}</td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(coupon)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 transition hover:bg-blue-200"
                                                        title="Edit coupon"
                                                        aria-label={`Edit coupon ${coupon.code}`}
                                                    >
                                                        <i className="fas fa-edit text-sm" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(coupon)}
                                                        disabled={deletingId === coupon._id}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                                                        title="Delete coupon"
                                                        aria-label={`Delete coupon ${coupon.code}`}
                                                    >
                                                        <i className="fas fa-trash text-sm" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-14 text-center text-slate-500">
                                        No coupons found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal ? (
                <CouponModal
                    editingCoupon={editingCoupon}
                    form={form}
                    setForm={setForm}
                    submitting={submitting}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    products={products}
                />
            ) : null}
        </section>
    );
}
