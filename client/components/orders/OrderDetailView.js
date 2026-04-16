"use client";

import Link from "next/link";

function splitName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "N/A",
    lastName: parts.slice(1).join(" ") || "N/A"
  };
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(Number(value || 0));
}

function formatDate(value, withTime = false) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString(
    "en-GB",
    withTime
      ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "long", year: "numeric" }
  );
}

function formatLabel(value = "") {
  return String(value || "pending")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildItemMeta(item = {}) {
  const lines = [];

  if (item.variantLabel) lines.push(item.variantLabel);
  if (item.variantSku) lines.push(`SKU: ${item.variantSku}`);

  const optionEntries = Object.entries(item.optionValues || {}).filter(([, value]) => value);
  if (!item.variantLabel && optionEntries.length) {
    lines.push(optionEntries.map(([key, value]) => `${key}: ${value}`).join(" / "));
  }

  if (item.vendor?.storeName || item.vendor?.name || item.vendor?.email) {
    lines.push(`Vendor: ${item.vendor.storeName || item.vendor.name || item.vendor.email}`);
  }

  return lines;
}

function statusTone(type, value) {
  const normalized = String(value || "pending").toLowerCase();

  if (type === "payment") {
    if (normalized === "paid") return "bg-emerald-100 text-emerald-800";
    if (normalized === "failed" || normalized === "refunded") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-800";
  }

  if (normalized === "delivered" || normalized === "shipped") return "bg-teal-100 text-teal-800";
  if (normalized === "cancelled" || normalized === "refunded") return "bg-rose-100 text-rose-700";
  if (normalized === "processing") return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-800";
}

function AddressCard({ icon, title, address, fallback }) {
  return (
    <div className="card section grid gap-4 !p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white">
          <i className={icon} />
        </div>
        <div>
          <div className="mini-label">{title}</div>
          <div className="text-lg font-semibold text-ink">{title}</div>
        </div>
      </div>
      {address ? (
        <div className="space-y-1 text-sm leading-6 text-slate-700">
          {address.fullName ? <p className="font-semibold text-ink">{address.fullName}</p> : null}
          {address.phone ? <p>{address.phone}</p> : null}
          {address.street ? <p>{address.street}</p> : null}
          <p>{[address.city, address.state].filter(Boolean).join(", ") || "N/A"} {address.postalCode || ""}</p>
          <p>{address.country || "N/A"}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">{fallback}</p>
      )}
    </div>
  );
}

export function OrderDetailView({ order, backHref, backLabel, eyebrow = "Order", title = "Order details", actions = null }) {
  const orderId = order?._id || "";
  const orderCode = `ORD-${orderId.slice(-8).toUpperCase() || "00000000"}`;
  const customerName = order?.customerName || order?.shippingAddress?.fullName || order?.user?.name || "";
  const customer = splitName(customerName);
  const itemSubtotal = order?.items?.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0) || 0;
  const shippingAmount = Number(order?.shippingAmount || 0);
  const discountAmount = Number(order?.discountAmount || 0);
  const totalAmount = Number(order?.totalAmount || itemSubtotal + shippingAmount - discountAmount);

  return (
    <section className="container page-section stack">
      <div className="card page-hero grid gap-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid gap-3">
            <div className="eyebrow">{eyebrow}</div>
            <h1 className="page-title">{title}</h1>
            <div className="font-mono text-sm font-semibold text-brand">{orderCode}</div>
            <div className="text-sm text-slate-600">Placed {formatDate(order?.createdAt, true)}</div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {actions}
            <Link href={backHref} className="btn-secondary">
              {backLabel}
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-amber-200 bg-amber-50/85 px-5 py-4 text-sm font-medium text-amber-900">
          Save this order code for future reference. It is the fastest way to identify the order in support and admin workflows.
        </div>
      </div>

      <div className="card section grid gap-5">
        <div>
          <div className="eyebrow">Contact details</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Customer information</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-black/8 bg-white/75 p-4">
            <div className="mini-label">First name</div>
            <div className="mt-2 font-semibold text-ink">{customer.firstName}</div>
          </div>
          <div className="rounded-[24px] border border-black/8 bg-white/75 p-4">
            <div className="mini-label">Last name</div>
            <div className="mt-2 font-semibold text-ink">{customer.lastName}</div>
          </div>
          <div className="rounded-[24px] border border-black/8 bg-white/75 p-4">
            <div className="mini-label">Email</div>
            <div className="mt-2 break-all font-semibold text-ink">{order?.customerEmail || order?.user?.email || "N/A"}</div>
          </div>
          <div className="rounded-[24px] border border-black/8 bg-white/75 p-4">
            <div className="mini-label">Phone</div>
            <div className="mt-2 font-semibold text-ink">{order?.customerPhone || order?.shippingAddress?.phone || "N/A"}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AddressCard icon="fa-solid fa-truck-fast" title="Shipping address" address={order?.shippingAddress} fallback="No shipping address was saved for this order." />
        <AddressCard icon="fa-regular fa-credit-card" title="Billing address" address={order?.billingAddress} fallback="Billing address is the same as shipping." />
      </div>

      <div className="card section grid gap-5">
        <div>
          <div className="eyebrow">Order items</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Products in this order</h2>
        </div>
        <div className="grid gap-4">
          {(order?.items || []).map((item, index) => {
            const meta = buildItemMeta(item);
            return (
              <div key={`${item.product || item.slug || item.name}-${index}`} className="grid gap-4 rounded-[26px] border border-black/8 bg-white/75 p-4 md:grid-cols-[88px_minmax(0,1fr)_auto] md:items-center">
                <div className="overflow-hidden rounded-[22px] border border-black/8 bg-sand">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-22 w-22 object-cover" />
                  ) : (
                    <div className="flex h-22 w-22 items-center justify-center text-slate-400">
                      <i className="fa-regular fa-image text-xl" />
                    </div>
                  )}
                </div>
                <div className="grid gap-1">
                  <div className="text-lg font-semibold text-ink">{item.name}</div>
                  {meta.map((line) => (
                    <div key={line} className="text-sm text-slate-600">{line}</div>
                  ))}
                  <div className="text-sm text-slate-600">Qty {item.quantity} x {formatMoney(item.price)}</div>
                </div>
                <div className="text-left md:text-right">
                  <div className="mini-label">Line total</div>
                  <div className="mt-2 text-xl font-semibold text-brand-deep">{formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="card section grid gap-4">
          <div>
            <div className="eyebrow">Order summary</div>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Totals</h2>
          </div>
          <div className="grid gap-3 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-[22px] border border-black/8 bg-white/70 px-4 py-3">
              <span>Items subtotal</span>
              <span className="font-semibold text-ink">{formatMoney(itemSubtotal)}</span>
            </div>
            <div className="flex items-center justify-between rounded-[22px] border border-black/8 bg-white/70 px-4 py-3">
              <span>Shipping</span>
              <span className="font-semibold text-ink">{formatMoney(shippingAmount)}</span>
            </div>
            {discountAmount > 0 ? (
              <div className="flex items-center justify-between rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                <span>Discount{order?.coupon?.code ? ` (${order.coupon.code})` : ""}</span>
                <span className="font-semibold">-{formatMoney(discountAmount)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded-[24px] bg-ink px-5 py-4 text-white">
              <span className="text-base font-semibold">Grand total</span>
              <span className="text-xl font-semibold">{formatMoney(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="card section grid gap-4">
          <div>
            <div className="eyebrow">Order status</div>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Current state</h2>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[22px] border border-black/8 bg-white/70 p-4">
              <div className="mini-label">Order status</div>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone("order", order?.status)}`}>
                {formatLabel(order?.status)}
              </span>
            </div>
            <div className="rounded-[22px] border border-black/8 bg-white/70 p-4">
              <div className="mini-label">Payment</div>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone("payment", order?.paymentStatus)}`}>
                {formatLabel(order?.paymentStatus)}
              </span>
            </div>
            <div className="rounded-[22px] border border-black/8 bg-white/70 p-4">
              <div className="mini-label">Payment method</div>
              <div className="mt-2 font-semibold text-ink">{formatLabel(order?.paymentMethod || "not set")}</div>
            </div>
            <div className="rounded-[22px] border border-black/8 bg-white/70 p-4">
              <div className="mini-label">Vendors</div>
              <div className="mt-2 text-sm font-semibold text-ink">{order?.vendorNames || "Marketplace"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
