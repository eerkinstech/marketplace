"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace";
import { cartStore } from "@/lib/utils/cart-store";
import { tokenStore } from "@/lib/auth/token-store";
import { API_URL } from "@/lib/constants/site";
import { formatCurrency } from "@/lib/utils/storefront";

const UK_COUNTRY = "United Kingdom";

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  country: UK_COUNTRY,
  postalCode: ""
};

function CheckoutIcon({ type, className = "h-5 w-5" }) {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  };

  if (type === "lock") {
    return (
      <svg {...commonProps}>
        <path d="M7 11V8a5 5 0 0 1 10 0v3" />
        <rect x="5" y="11" width="14" height="10" rx="2" />
      </svg>
    );
  }

  if (type === "truck") {
    return (
      <svg {...commonProps}>
        <path d="M3 7h11v8H3z" />
        <path d="M14 10h3l3 3v2h-6z" />
        <circle cx="7.5" cy="18.5" r="1.5" />
        <circle cx="17.5" cy="18.5" r="1.5" />
      </svg>
    );
  }

  return null;
}

function getDefaultAddress(profile) {
  const addresses = Array.isArray(profile?.addresses) ? profile.addresses : [];
  return addresses.find((entry) => entry?.isDefault) || addresses[0] || null;
}

function buildAddressFromProfile(profile) {
  const address = getDefaultAddress(profile);
  return {
    fullName: address?.fullName || profile?.name || "",
    phone: address?.phone || profile?.phone || "",
    street: address?.street || "",
    city: address?.city || "",
    state: address?.state || "",
    country: UK_COUNTRY,
    postalCode: address?.postalCode || ""
  };
}

function addressLooksFilled(address) {
  return ["street", "city", "state", "postalCode"].some((key) => Boolean(address?.[key]));
}

function buildCheckoutItems(items) {
  return items
    .map((item) => ({
      productId: String(item?.productId || "").trim(),
      quantity: Number(item?.quantity || 0),
      variantSku: item?.variantSku || undefined,
      optionValues: item?.optionValues || undefined
    }))
    .filter((item) => item.productId && item.quantity > 0);
}

export default function CheckoutPage() {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [items, setItems] = useState([]);
  const [token, setToken] = useState("");
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [shippingAddress, setShippingAddress] = useState(EMPTY_ADDRESS);
  const [billingAddress, setBillingAddress] = useState(EMPTY_ADDRESS);
  const [shippingQuote, setShippingQuote] = useState({
    amount: 0,
    lines: [],
    error: "",
    loading: false
  });
  const [couponCode, setCouponCode] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponState, setCouponState] = useState({
    discountAmount: 0,
    product: null,
    error: "",
    loading: false
  });

  useEffect(() => {
    setItems(cartStore.getItems());
    setToken(tokenStore.get());
    setCouponCode(cartStore.getCoupon());
    setCouponInput(cartStore.getCoupon());

    const syncAuth = () => setToken(tokenStore.get());
    const syncCart = () => setItems(cartStore.getItems());
    const syncCoupon = () => {
      const nextCoupon = cartStore.getCoupon();
      setCouponCode(nextCoupon);
      setCouponInput(nextCoupon);
    };

    window.addEventListener("auth:updated", syncAuth);
    window.addEventListener("cart:updated", syncCart);
    window.addEventListener("cart:coupon-updated", syncCoupon);

    return () => {
      window.removeEventListener("auth:updated", syncAuth);
      window.removeEventListener("cart:updated", syncCart);
      window.removeEventListener("cart:coupon-updated", syncCoupon);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!token) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        const response = await marketplaceApi.getAuthProfile(token);
        if (!active) return;
        const profile = response?.data || {};
        const nextCustomer = {
          name: profile?.name || "",
          email: profile?.email || "",
          phone: profile?.phone || ""
        };
        const nextShipping = buildAddressFromProfile(profile);

        setCustomer((current) => ({
          name: current.name || nextCustomer.name,
          email: current.email || nextCustomer.email,
          phone: current.phone || nextCustomer.phone
        }));

        setShippingAddress((current) => ({
          ...nextShipping,
          fullName: current.fullName || nextShipping.fullName,
          phone: current.phone || nextShipping.phone,
          street: current.street || nextShipping.street,
          city: current.city || nextShipping.city,
          state: current.state || nextShipping.state,
          postalCode: current.postalCode || nextShipping.postalCode,
          country: UK_COUNTRY
        }));

        if (sameAsShipping && !addressLooksFilled(billingAddress)) {
          setBillingAddress(nextShipping);
        }
      } catch {
      } finally {
        if (active) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (sameAsShipping) {
      setBillingAddress({ ...shippingAddress });
    }
  }, [sameAsShipping, shippingAddress]);

  useEffect(() => {
    let active = true;

    async function loadShippingQuote() {
      if (!items.length) {
        setShippingQuote({
          amount: 0,
          lines: [],
          error: "",
          loading: false
        });
        return;
      }

      setShippingQuote((current) => ({ ...current, loading: true, error: "" }));

      try {
        const response = await marketplaceApi.quoteShipping({
          items: buildCheckoutItems(items)
        }, token);

        if (!active) return;

        setShippingQuote({
          amount: Number(response?.data?.shippingAmount || 0),
          lines: response?.data?.lines || [],
          error: "",
          loading: false
        });
      } catch (quoteError) {
        if (!active) return;
        setShippingQuote({
          amount: 0,
          lines: [],
          error: quoteError?.message || "Unable to calculate shipping right now.",
          loading: false
        });
      }
    }

    loadShippingQuote();

    return () => {
      active = false;
    };
  }, [items, token]);

  useEffect(() => {
    let active = true;

    async function loadCouponQuote() {
      if (!couponCode || !items.length) {
        setCouponState({
          discountAmount: 0,
          product: null,
          error: "",
          loading: false
        });
        return;
      }

      setCouponState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const response = await marketplaceApi.quoteCoupon({
          items: buildCheckoutItems(items),
          couponCode
        }, token);

        if (!active) return;

        setCouponState({
          discountAmount: Number(response?.data?.discountAmount || 0),
          product: response?.data?.product || null,
          error: "",
          loading: false
        });
      } catch (error) {
        if (!active) return;
        setCouponState({
          discountAmount: 0,
          product: null,
          error: error?.message || "Unable to apply coupon right now.",
          loading: false
        });
      }
    }

    loadCouponQuote();

    return () => {
      active = false;
    };
  }, [couponCode, items, token]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [items]
  );
  const shippingAmount = shippingQuote.amount;
  const discountAmount = Number(couponState.discountAmount || 0);
  const grandTotal = Math.max(0, total + shippingAmount - discountAmount);

  function applyCoupon() {
    cartStore.setCoupon(couponInput);
  }

  function removeCoupon() {
    cartStore.clearCoupon();
    setCouponState({
      discountAmount: 0,
      product: null,
      error: "",
      loading: false
    });
  }

  function updateCustomerField(event) {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
    if (name === "name") {
      setShippingAddress((current) => ({ ...current, fullName: value }));
      if (sameAsShipping) setBillingAddress((current) => ({ ...current, fullName: value }));
    }
    if (name === "phone") {
      setShippingAddress((current) => ({ ...current, phone: value }));
      if (sameAsShipping) setBillingAddress((current) => ({ ...current, phone: value }));
    }
  }

  function updateAddress(setter, field, value) {
    setter((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!items.length || submitting) return;

    setSubmitting(true);
    setNotice("");

    const sanitizedShipping = {
      ...shippingAddress,
      fullName: shippingAddress.fullName || customer.name,
      phone: shippingAddress.phone || customer.phone,
      country: UK_COUNTRY
    };
    const sanitizedBilling = sameAsShipping
      ? { ...sanitizedShipping }
      : {
        ...billingAddress,
        fullName: billingAddress.fullName || customer.name,
        phone: billingAddress.phone || customer.phone,
        country: UK_COUNTRY
      };

    try {
      const payload = {
        items: cartStore.getItems().map((item) => ({
          productId: String(item?.productId || "").trim(),
          quantity: Number(item?.quantity || 0),
          variantSku: item?.variantSku || undefined,
          optionValues: item?.optionValues || undefined
        })).filter((item) => item.productId && item.quantity > 0),
        couponCode: couponCode || undefined,
        customerEmail: customer.email,
        shippingAddress: sanitizedShipping,
        billingAddress: sanitizedBilling,
        paymentMethod: "cod"
      };

      const response = await fetch(`${API_URL}/catalog/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || "Checkout failed.");
      }

      cartStore.clear();
      if (token) {
        router.push("/account");
        router.refresh();
        return;
      }

      setNotice("Order placed successfully. We will contact you using the details you provided.");
      setItems([]);
    } catch (error) {
      setNotice(error?.message || "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-section px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-8">
        <div className="rounded-[28px] border border-black/8 bg-white/95 p-6 shadow-[0_16px_40px_rgba(16,32,26,0.06)] sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Checkout</div>
              <h1 className="mt-3 text-[2.1rem] font-medium leading-tight tracking-tight text-ink sm:text-[2.7rem]">
                Secure UK checkout with customer details, billing, and delivery information
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                Signed-in customers get their saved account details prefilled automatically. Guests can check out directly with name, email, phone, billing address, and shipping address.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[22px] border border-black/8 bg-[#fcfaf7] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Items</div>
                <div className="mt-2 text-3xl font-black text-ink">{items.length}</div>
              </div>
              <div className="rounded-[22px] border border-black/8 bg-[#fcfaf7] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Order total</div>
                <div className="mt-2 text-3xl font-black text-ink">{formatCurrency(grandTotal)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-6">
            <div className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_16px_40px_rgba(16,32,26,0.06)] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f6efe5] text-[#b8742f]">
                  <CheckoutIcon type="lock" />
                </span>
                <div>
                  <h2 className="text-2xl font-medium tracking-tight text-ink">Customer details</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {token ? "Your account details are loaded automatically when available." : "Use your own details to complete checkout without creating an account."}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-ink">Full name</label>
                  <input
                    id="checkout-name"
                    name="name"
                    value={customer.name}
                    onChange={updateCustomerField}
                    required
                    autoComplete="name"
                    className="h-12 rounded-[16px] border border-black/10 bg-white px-4 text-sm text-ink outline-none"
                    placeholder="Muhammad Ali"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-ink">Email</label>
                  <input
                    type="email"
                    id="checkout-email"
                    name="email"
                    value={customer.email}
                    onChange={updateCustomerField}
                    required
                    autoComplete="email"
                    className="h-12 rounded-[16px] border border-black/10 bg-white px-4 text-sm text-ink outline-none"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <label className="text-sm font-semibold text-ink">Phone</label>
                  <input
                    type="tel"
                    id="checkout-phone"
                    name="phone"
                    value={customer.phone}
                    onChange={updateCustomerField}
                    required
                    autoComplete="tel"
                    className="h-12 rounded-[16px] border border-black/10 bg-white px-4 text-sm text-ink outline-none"
                    placeholder="+44 7123 456789"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_16px_40px_rgba(16,32,26,0.06)] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f6efe5] text-[#b8742f]">
                  <CheckoutIcon type="truck" />
                </span>
                <div>
                  <h2 className="text-2xl font-medium tracking-tight text-ink">Shipping address</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    UK only. Enter the delivery address manually below.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                  <label htmlFor="shipping-street" className="text-sm font-semibold text-ink">Address line</label>
                  <input
                    id="shipping-street"
                    name="shippingStreet"
                    value={shippingAddress.street}
                    onChange={(event) => updateAddress(setShippingAddress, "street", event.target.value)}
                    required
                    autoComplete="section-shipping shipping street-address"
                    className="h-12 rounded-[16px] border border-black/10 bg-white px-4 text-sm text-ink outline-none"
                    placeholder="House number and street"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-ink">Town / City</label>
                  <input
                    id="shipping-city"
                    name="shippingCity"
                    value={shippingAddress.city}
                    onChange={(event) => updateAddress(setShippingAddress, "city", event.target.value)}
                    required
                    autoComplete="section-shipping shipping address-level2"
                    className="h-12 rounded-[16px] border border-black/10 bg-white px-4 text-sm text-ink outline-none"
                    placeholder="Manchester"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-ink">County / Region</label>
                  <input
                    id="shipping-state"
                    name="shippingState"
                    value={shippingAddress.state}
                    onChange={(event) => updateAddress(setShippingAddress, "state", event.target.value)}
                    required
                    autoComplete="section-shipping shipping address-level1"
                    className="h-12 rounded-[16px] border border-black/10 bg-white px-4 text-sm text-ink outline-none"
                    placeholder="Greater Manchester"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-ink">Postcode</label>
                  <input
                    id="shipping-postal-code"
                    name="shippingPostalCode"
                    value={shippingAddress.postalCode}
                    onChange={(event) => updateAddress(setShippingAddress, "postalCode", event.target.value.toUpperCase())}
                    required
                    autoComplete="section-shipping shipping postal-code"
                    className="h-12 rounded-[16px] border border-black/10 bg-white px-4 text-sm uppercase text-ink outline-none"
                    placeholder="SW1A 1AA"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-ink">Country</label>
                  <input
                    id="shipping-country"
                    name="shippingCountry"
                    value={UK_COUNTRY}
                    readOnly
                    autoComplete="section-shipping shipping country-name"
                    className="h-12 rounded-[16px] border border-black/10 bg-[#faf6f0] px-4 text-sm text-ink outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_16px_40px_rgba(16,32,26,0.06)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium tracking-tight text-ink">Billing address</h2>
                  <p className="mt-1 text-sm text-slate-500">Use the same address or enter a separate billing address.</p>
                </div>
                <label className="flex items-center gap-3 rounded-full bg-[#faf6f0] px-4 py-2 text-sm font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(event) => setSameAsShipping(event.target.checked)}
                    className="h-4 w-4 accent-[#b8742f]"
                  />
                  Same as shipping
                </label>
              </div>

              {!sameAsShipping ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2 md:col-span-2">
                    <label htmlFor="billing-street" className="text-sm font-semibold text-ink">Billing address line</label>
                    <input
                      id="billing-street"
                      name="billingStreet"
                      value={billingAddress.street}
                      onChange={(event) => updateAddress(setBillingAddress, "street", event.target.value)}
                      required
                      autoComplete="section-billing billing street-address"
                      className="h-12 rounded-[16px] border border-black/10 bg-white px-4 text-sm text-ink outline-none"
                      placeholder="Billing house number and street"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-ink">Town / City</label>
                    <input
                      id="billing-city"
                      name="billingCity"
                      value={billingAddress.city}
                      onChange={(event) => updateAddress(setBillingAddress, "city", event.target.value)}
                      required
                      autoComplete="section-billing billing address-level2"
                      className="h-12 rounded-[16px] border border-black/10 bg-white px-4 text-sm text-ink outline-none"
                      placeholder="Birmingham"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-ink">County / Region</label>
                    <input
                      id="billing-state"
                      name="billingState"
                      value={billingAddress.state}
                      onChange={(event) => updateAddress(setBillingAddress, "state", event.target.value)}
                      required
                      autoComplete="section-billing billing address-level1"
                      className="h-12 rounded-[16px] border border-black/10 bg-white px-4 text-sm text-ink outline-none"
                      placeholder="West Midlands"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-ink">Postcode</label>
                    <input
                      id="billing-postal-code"
                      name="billingPostalCode"
                      value={billingAddress.postalCode}
                      onChange={(event) => updateAddress(setBillingAddress, "postalCode", event.target.value.toUpperCase())}
                      required
                      autoComplete="section-billing billing postal-code"
                      className="h-12 rounded-[16px] border border-black/10 bg-white px-4 text-sm uppercase text-ink outline-none"
                      placeholder="B1 1AA"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-ink">Country</label>
                    <input
                      id="billing-country"
                      name="billingCountry"
                      value={UK_COUNTRY}
                      readOnly
                      autoComplete="section-billing billing country-name"
                      className="h-12 rounded-[16px] border border-black/10 bg-[#faf6f0] px-4 text-sm text-ink outline-none"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {notice ? (
              <div className="rounded-[18px] border border-black/8 bg-white px-5 py-4 text-sm text-slate-700 shadow-[0_12px_26px_rgba(16,32,26,0.05)]">
                {notice}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!items.length || submitting || Boolean(shippingQuote.error) || Boolean(couponCode && couponState.error)}
                className="inline-flex h-14 items-center justify-center rounded-[16px] bg-[#b8742f] px-7 text-base font-bold text-white transition hover:bg-[#9f6428] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? "Placing order..." : token ? "Place order" : "Place guest order"}
              </button>
              <Link href="/cart" className="inline-flex h-14 items-center justify-center rounded-[16px] border border-black/10 bg-white px-7 text-base font-semibold text-ink transition hover:bg-[#faf6f0]">
                Back to cart
              </Link>
            </div>
          </form>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_16px_40px_rgba(16,32,26,0.06)]">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Order summary</div>
              <h2 className="mt-3 text-[2rem] font-medium leading-tight tracking-tight text-ink">Your items</h2>
              <p className="mt-2 text-sm text-slate-500">
                {loadingProfile ? "Loading saved customer details..." : token ? "Signed in account details will be used where available." : "Guest checkout is enabled for UK delivery addresses."}
              </p>

              <div className="mt-6 grid gap-4">
                {items.length ? items.map((item) => (
                  <div key={item.cartKey || item.productId} className="rounded-[20px] border border-black/8 bg-[#fcfaf7] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <strong className="block text-sm text-ink">{item.name}</strong>
                        <div className="mt-1 text-xs text-slate-500">Qty {item.quantity}</div>
                        {item.variantLabel ? <div className="mt-1 text-xs text-slate-500">{item.variantLabel}</div> : null}
                      </div>
                      <strong className="text-sm text-ink">{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</strong>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[20px] border border-black/8 bg-[#fcfaf7] p-4 text-sm text-slate-600">
                    Your cart is empty. Add products before checking out.
                  </div>
                )}
              </div>

              {shippingQuote.lines.length ? (
                <div className="mt-6 rounded-[20px] border border-black/8 bg-[#fcfaf7] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Shipping breakdown</div>
                  <div className="mt-3 grid gap-3">
                    {shippingQuote.lines.map((line, index) => (
                      <div key={`${line.product}-${index}`} className="flex items-start justify-between gap-4 text-sm">
                        <div className="min-w-0">
                          <div className="font-semibold text-ink">{line.name}</div>
                          <div className="text-xs text-slate-500">
                            {line.shippingName} • {line.weight} kg • Qty {line.quantity}
                            {line.eta ? ` • ETA ${line.eta}` : ""}
                          </div>
                        </div>
                        <strong className="text-ink">{formatCurrency(line.lineTotal)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {shippingQuote.error ? (
                <div className="mt-6 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {shippingQuote.error}
                </div>
              ) : null}

              <div className="mt-6 rounded-[20px] border border-black/8 bg-[#fcfaf7] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Coupon</div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="h-11 min-w-0 flex-1 rounded-[14px] border border-black/10 bg-white px-4 text-sm text-ink outline-none"
                  />
                  <button type="button" onClick={applyCoupon} className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[#b8742f] px-4 text-sm font-bold text-white transition hover:bg-[#9f6428]">
                    Apply
                  </button>
                </div>
                {couponCode ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span>Applied: <strong className="text-ink">{couponCode}</strong></span>
                    <button type="button" onClick={removeCoupon} className="text-rose-600 transition hover:text-rose-700">
                      Remove
                    </button>
                  </div>
                ) : null}
                {couponState.product?.name ? (
                  <div className="mt-2 text-xs text-slate-500">Assigned product: {couponState.product.name}</div>
                ) : null}
                {couponState.loading ? <div className="mt-2 text-xs text-slate-500">Checking coupon...</div> : null}
                {couponState.error ? <div className="mt-2 text-xs text-red-700">{couponState.error}</div> : null}
              </div>

              <div className="mt-6 grid gap-3 border-t border-black/8 pt-5 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <strong className="text-ink">{formatCurrency(total)}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Coupon discount</span>
                  <strong className="text-ink">
                    {couponState.loading ? "Calculating..." : `-${formatCurrency(discountAmount)}`}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Shipping</span>
                  <strong className="text-ink">
                    {shippingQuote.loading ? "Calculating..." : shippingAmount === 0 ? "Free" : formatCurrency(shippingAmount)}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Payment</span>
                  <strong className="text-ink">Cash on delivery</strong>
                </div>
                <div className="flex items-center justify-between border-t border-black/8 pt-3 text-base">
                  <span className="font-semibold text-ink">Total</span>
                  <strong className="text-xl font-black text-[#b8742f]">{formatCurrency(grandTotal)}</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
