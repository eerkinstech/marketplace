"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { tokenStore } from "@/lib/auth/token-store";
import { cartStore } from "@/lib/utils/cart-store";
import { formatCurrency } from "@/lib/utils/storefront";

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

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [token, setToken] = useState("");
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

  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [items]);
  const estimatedTotal = Math.max(0, total - Number(couponState.discountAmount || 0));
  const isAuthenticated = Boolean(token);

  function syncItems() {
    setItems(cartStore.getItems());
  }

  function handleApplyCoupon() {
    cartStore.setCoupon(couponInput);
  }

  function handleRemoveCoupon() {
    cartStore.clearCoupon();
    setCouponState({
      discountAmount: 0,
      product: null,
      error: "",
      loading: false
    });
  }

  return (
    <section className="container page-section">
      <div className="surface-panel page-hero mb-6">
        <div className="relative z-10 section-heading">
          <div>
            <div className="eyebrow">Shopping cart</div>
            <h1 className="page-title mt-2">Review your items before checkout</h1>
            <p className="muted-copy mt-4 max-w-2xl">
              Adjust quantities, remove products, and keep a clear view of your order total before placing the order.
            </p>
          </div>
          <div className="hero-metrics">
            <div className="stat-chip">
              <div className="mini-label">Items</div>
              <strong className="mt-2 block text-3xl text-ink">{itemCount}</strong>
            </div>
            <div className="stat-chip">
              <div className="mini-label">Subtotal</div>
              <strong className="mt-2 block text-3xl text-ink">{formatCurrency(total)}</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="checkout-layout">
        <div className="stack">
          {items.map((item) => (
            <article key={item.cartKey || item.productId} className="surface-panel flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-[22px] bg-mist">
                  {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : null}
                </div>
                <div>
                  <Link href={`/product/${item.slug}`} className="font-display text-2xl font-bold text-ink">
                    {item.name}
                  </Link>
                  <div className="small mt-2">{formatCurrency(item.price)} each</div>
                  {item.variantLabel ? <div className="small mt-1">{item.variantLabel}</div> : null}
                  {item.variantSku ? <div className="small mt-1">SKU: {item.variantSku}</div> : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="quantity-pill">
                  <button type="button" onClick={() => { cartStore.setQuantity(item.cartKey || item.productId, item.quantity - 1); syncItems(); }}>-</button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => { cartStore.setQuantity(item.cartKey || item.productId, item.quantity + 1); syncItems(); }}>+</button>
                </div>
                <strong className="text-xl text-ink">{formatCurrency(item.price * item.quantity)}</strong>
                <button className="btn-secondary" type="button" onClick={() => { cartStore.remove(item.cartKey || item.productId); syncItems(); }}>
                  Remove
                </button>
              </div>
            </article>
          ))}
          {!items.length ? (
            <div className="surface-panel p-8 text-sm text-slate-600">
              Your cart is empty. Browse the catalog and add products to start an order.
            </div>
          ) : null}
        </div>
        <aside className="surface-panel h-fit self-start p-6 lg:sticky lg:top-24">
          <div className="eyebrow">Order summary</div>
          <h2 className="mt-3 font-display text-3xl text-ink">Ready to checkout</h2>

          <div className="mt-5 rounded-[20px] border border-black/8 bg-slate-50/80 p-4">
            <label className="mb-2 block text-sm font-semibold text-ink">Coupon code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="field-input min-w-0 flex-1"
              />
              <button type="button" onClick={handleApplyCoupon} className="btn-primary whitespace-nowrap">
                Apply
              </button>
            </div>
            {couponCode ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>Applied: <strong className="text-ink">{couponCode}</strong></span>
                <button type="button" onClick={handleRemoveCoupon} className="text-rose-600 transition hover:text-rose-700">
                  Remove
                </button>
              </div>
            ) : null}
            {couponState.product?.name ? (
              <div className="mt-2 text-xs text-slate-500">Assigned product: {couponState.product.name}</div>
            ) : null}
            {couponState.loading ? <div className="mt-2 text-xs text-slate-500">Checking coupon...</div> : null}
            {couponState.error ? <div className="mt-2 text-xs text-rose-600">{couponState.error}</div> : null}
          </div>

          <div className="mt-5 grid gap-3">
            <div className="checkout-summary-row"><span>Items</span><strong>{itemCount}</strong></div>
            <div className="checkout-summary-row"><span>Subtotal</span><strong>{formatCurrency(total)}</strong></div>
            <div className="checkout-summary-row"><span>Coupon discount</span><strong>{couponState.loading ? "Calculating..." : `-${formatCurrency(couponState.discountAmount)}`}</strong></div>
            <div className="checkout-summary-row"><span>Shipping</span><strong>Calculated at order</strong></div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-black/8 pt-4">
            <span className="text-sm text-slate-600">Estimated total</span>
            <strong className="text-3xl text-ink">{formatCurrency(estimatedTotal)}</strong>
          </div>
          <div className="mt-6 grid gap-3">
            <Link href={isAuthenticated ? "/checkout" : "/login"} className="btn-primary text-center">
              {isAuthenticated ? "Continue to checkout" : "Login to checkout"}
            </Link>
            <Link href="/products" className="btn-secondary text-center">Keep shopping</Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
