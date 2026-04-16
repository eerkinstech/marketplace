"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { tokenStore } from "@/lib/auth/token-store";
import { AccountQuickLinks } from "@/components/account/AccountQuickLinks";

const UK_COUNTRY = "United Kingdom";

const EMPTY_SHIPPING = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: UK_COUNTRY
};

function formatDate(value) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function formatAddress(address) {
  if (!address) return "No saved shipping address";

  const parts = [
    address.fullName,
    address.phone,
    address.street,
    address.city,
    address.state,
    address.country,
    address.postalCode
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "No saved shipping address";
}

function buildShippingDraft(profile) {
  const address = profile?.addresses?.find((entry) => entry.isDefault) || profile?.addresses?.[0] || null;

  return {
    fullName: address?.fullName || profile?.name || "",
    phone: address?.phone || profile?.phone || "",
    street: address?.street || "",
    city: address?.city || "",
    state: address?.state || "",
    postalCode: address?.postalCode || "",
    country: address?.country || UK_COUNTRY
  };
}

export default function AccountHomePage() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [shippingDraft, setShippingDraft] = useState(EMPTY_SHIPPING);

  useEffect(() => {
    async function load() {
      try {
        const token = tokenStore.get();
        if (!token) {
          setError("Login first to view your account details.");
          return;
        }

        const [profileResponse, ordersResponse] = await Promise.all([
          marketplaceApi.getAuthProfile(token),
          marketplaceApi.getCustomerOrders(token)
        ]);

        const nextProfile = profileResponse.data || null;
        setProfile(nextProfile);
        setOrders(ordersResponse.data || []);
        setShippingDraft(buildShippingDraft(nextProfile));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const defaultAddress = useMemo(
    () => profile?.addresses?.find((entry) => entry.isDefault) || profile?.addresses?.[0] || null,
    [profile]
  );

  function updateShippingField(field, value) {
    setShippingDraft((current) => ({ ...current, [field]: value }));
    setNotice("");
  }

  async function handleShippingSave(event) {
    event.preventDefault();

    const token = tokenStore.get();
    if (!token) {
      setError("Login first to update your shipping details.");
      return;
    }

    setSaving(true);
    setNotice("");

    try {
      const response = await marketplaceApi.updateAuthProfile(token, {
        name: profile?.name || "",
        email: profile?.email || "",
        phone: shippingDraft.phone || profile?.phone || "",
        shippingAddress: {
          fullName: shippingDraft.fullName || profile?.name || "",
          phone: shippingDraft.phone || profile?.phone || "",
          street: shippingDraft.street || "",
          city: shippingDraft.city || "",
          state: shippingDraft.state || "",
          country: shippingDraft.country || UK_COUNTRY,
          postalCode: shippingDraft.postalCode || ""
        }
      });

      const updatedProfile = response.data || null;
      setProfile(updatedProfile);
      setShippingDraft(buildShippingDraft(updatedProfile));
      setNotice("Shipping details saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="container page-section stack">
      <div>
        <div className="kicker">Customer account</div>
        <h1 className="page-title">Account dashboard</h1>
        <p className="section-copy">View your contact details, order history, and saved shipping address.</p>
      </div>

      <AccountQuickLinks />

      {error ? <div className="card section small">{error}</div> : null}
      {notice ? <div className="card section small border-emerald-200 bg-emerald-50 text-emerald-900">{notice}</div> : null}

      {loading ? (
        <div className="glass-card p-6 text-sm text-slate-500">Loading account details...</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="glass-card p-6">
            <div className="eyebrow">Profile</div>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{profile?.name || "Customer"}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Email</div>
                <div className="mt-1 text-sm text-slate-700">{profile?.email || "N/A"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Phone</div>
                <div className="mt-1 text-sm text-slate-700">{profile?.phone || "N/A"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Role</div>
                <div className="mt-1 text-sm text-slate-700 capitalize">{profile?.role || "customer"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Member since</div>
                <div className="mt-1 text-sm text-slate-700">{formatDate(profile?.createdAt)}</div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/support" className="btn-secondary">Open chat</Link>
              <Link href="/returns" className="btn-primary">Create return</Link>
            </div>
          </article>

          <article className="glass-card p-6">
            <div className="eyebrow">Shipping details</div>
            <div className="mt-2 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-semibold text-ink">Saved checkout shipping</h2>
              <Link href="/account/orders" className="soft-link">View orders</Link>
            </div>

            <form onSubmit={handleShippingSave} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Full name</label>
                  <input
                    value={shippingDraft.fullName}
                    onChange={(event) => updateShippingField("fullName", event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none"
                    placeholder="Muhammad Ali"
                    autoComplete="name"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</label>
                  <input
                    value={shippingDraft.phone}
                    onChange={(event) => updateShippingField("phone", event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none"
                    placeholder="+44 7123 456789"
                    autoComplete="tel"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Address line</label>
                  <input
                    value={shippingDraft.street}
                    onChange={(event) => updateShippingField("street", event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none"
                    placeholder="House number and street"
                    autoComplete="street-address"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Town / City</label>
                  <input
                    value={shippingDraft.city}
                    onChange={(event) => updateShippingField("city", event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none"
                    placeholder="Manchester"
                    autoComplete="address-level2"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">County / Region</label>
                  <input
                    value={shippingDraft.state}
                    onChange={(event) => updateShippingField("state", event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none"
                    placeholder="Greater Manchester"
                    autoComplete="address-level1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Postcode</label>
                  <input
                    value={shippingDraft.postalCode}
                    onChange={(event) => updateShippingField("postalCode", event.target.value.toUpperCase())}
                    className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm uppercase outline-none"
                    placeholder="SW1A 1AA"
                    autoComplete="postal-code"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Country</label>
                  <input
                    value={shippingDraft.country}
                    readOnly
                    className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-[#f7f3ec] px-4 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save shipping details"}
                </button>
                <Link href="/checkout" className="btn-secondary">Go to checkout</Link>
              </div>
            </form>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f7f3ec] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total orders</div>
                <div className="mt-2 text-3xl font-black text-ink">{orders.length}</div>
              </div>
              <div className="rounded-2xl bg-[#f7f3ec] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Saved addresses</div>
                <div className="mt-2 text-3xl font-black text-ink">{profile?.addresses?.length || 0}</div>
              </div>
            </div>
           
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/account/returns" className="btn-secondary">Return page</Link>
              <Link href="/products" className="btn-primary">Shop now</Link>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
