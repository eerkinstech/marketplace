"use client";

import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function buildCustomers(orders = [], customers = [], subscribers = []) {
  const newsletterEmails = new Set(
    (subscribers || [])
      .map((subscriber) => String(subscriber.email || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const customerMap = new Map();

  function ensureCustomer(key, payload) {
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        id: payload.id || key,
        email: payload.email || "Unknown",
        name: payload.name || "Guest customer",
        phone: payload.phone || "N/A",
        address: payload.address || null,
        orders: [],
        totalSpent: 0,
        orderCount: 0,
        unitsPurchased: 0,
        createdAt: payload.createdAt || null,
        lastOrderAt: null,
        isNewsletterSubscribed: newsletterEmails.has(String(payload.email || "").trim().toLowerCase())
      });
    }

    return customerMap.get(key);
  }

  (orders || []).forEach((order) => {
    const email = String(order.customerEmail || order.user?.email || "").trim().toLowerCase();
    const name = order.customerName || order.user?.name || "Guest customer";
    const phone = order.customerPhone || order.shippingAddress?.phone || order.user?.phone || "N/A";
    const key = email || `guest:${order._id}`;

    const customer = ensureCustomer(key, {
      id: order.user?._id || key,
      email: email || "Unknown",
      name,
      phone,
      address: order.shippingAddress || order.billingAddress || null,
      createdAt: order.createdAt
    });

    customer.orders.push(order);
    customer.orderCount += 1;
    customer.unitsPurchased += (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    customer.totalSpent += Number(order.totalAmount || 0);
    customer.lastOrderAt = !customer.lastOrderAt || new Date(order.createdAt) > new Date(customer.lastOrderAt)
      ? order.createdAt
      : customer.lastOrderAt;
    customer.createdAt = !customer.createdAt || new Date(order.createdAt) < new Date(customer.createdAt)
      ? order.createdAt
      : customer.createdAt;
    if (!customer.address && (order.shippingAddress || order.billingAddress)) {
      customer.address = order.shippingAddress || order.billingAddress;
    }
    if (newsletterEmails.has(email)) {
      customer.isNewsletterSubscribed = true;
    }
  });

  (customers || []).forEach((customerRecord) => {
    const email = String(customerRecord.email || "").trim().toLowerCase();
    const key = email || String(customerRecord._id);
    const customer = ensureCustomer(key, {
      id: customerRecord._id,
      email: customerRecord.email || "Unknown",
      name: customerRecord.name || "Customer",
      phone: customerRecord.phone || "N/A",
      address: customerRecord.addresses?.find((address) => address.isDefault) || customerRecord.addresses?.[0] || null,
      createdAt: customerRecord.createdAt
    });

    customer.name = customer.name || customerRecord.name || "Customer";
    customer.phone = customer.phone === "N/A" ? customerRecord.phone || "N/A" : customer.phone;
    customer.address = customer.address || customerRecord.addresses?.find((address) => address.isDefault) || customerRecord.addresses?.[0] || null;
    customer.createdAt = customer.createdAt || customerRecord.createdAt;
    if (newsletterEmails.has(email)) {
      customer.isNewsletterSubscribed = true;
    }
  });

  return Array.from(customerMap.values()).sort(
    (left, right) => new Date(right.lastOrderAt || right.createdAt || 0) - new Date(left.lastOrderAt || left.createdAt || 0)
  );
}

function SortButton({ label, column, sortConfig, onSort }) {
  const active = sortConfig.key === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-950"
    >
      <span>{label}</span>
      <span className="inline-flex flex-col text-[10px] leading-none">
        <span className={active && sortConfig.order === "asc" ? "text-slate-900" : "text-slate-300"}>▲</span>
        <span className={active && sortConfig.order === "desc" ? "text-slate-900" : "text-slate-300"}>▼</span>
      </span>
    </button>
  );
}

function AddressBlock({ title, address }) {
  if (!address) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <div className="mt-3 space-y-1 text-sm text-slate-700">
        <p className="font-medium">{address.fullName || "No recipient name"}</p>
        <p>{address.street || "No street available"}</p>
        <p>
          {[address.city, address.state, address.postalCode].filter(Boolean).join(", ") || "No city or postal code"}
        </p>
        <p>{address.country || "No country available"}</p>
        {address.phone ? <p>{address.phone}</p> : null}
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 fill-none stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
      <path d="M10 9h1" />
    </svg>
  );
}

export default function AdminCustomersPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to view customers.");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "orderCount", order: "desc" });

  useEffect(() => {
    async function load() {
      if (!token) return;

      try {
        setLoading(true);
        const [ordersResponse, customersResponse, subscribersResponse] = await Promise.all([
          marketplaceApi.getAdminOrders(token),
          marketplaceApi.getAdminCustomers(token),
          marketplaceApi.getAdminNewsletterSubscribers(token)
        ]);

        setCustomers(
          buildCustomers(
            ordersResponse.data || [],
            customersResponse.data || [],
            subscribersResponse.data || []
          )
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, setError]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = [...customers];

    const visible = query
      ? rows.filter((customer) =>
          [customer.name, customer.email, customer.phone]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        )
      : rows;

    return visible.sort((left, right) => {
      const direction = sortConfig.order === "asc" ? 1 : -1;
      const leftValue = left[sortConfig.key];
      const rightValue = right[sortConfig.key];

      if (typeof leftValue === "string" || typeof rightValue === "string") {
        return String(leftValue || "").localeCompare(String(rightValue || "")) * direction;
      }

      return (Number(leftValue || 0) - Number(rightValue || 0)) * direction;
    });
  }, [customers, search, sortConfig]);

  const stats = useMemo(() => {
    const totalRevenue = customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0);
    const subscribers = customers.filter((customer) => customer.isNewsletterSubscribed).length;
    return {
      totalCustomers: customers.length,
      totalRevenue,
      subscribers
    };
  }, [customers]);

  function handleSort(key) {
    setSortConfig((current) => ({
      key,
      order: current.key === key && current.order === "asc" ? "desc" : "asc"
    }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Customers</h1>
        <p className="mt-2 text-slate-600">Search customers, inspect order history, and track newsletter engagement.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
          Loading customers...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Total Customers</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalCustomers}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Newsletter Subscribers</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{stats.subscribers}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers by name, email, or phone"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Contact</th>
                  <th className="px-6 py-4 text-left"><SortButton label="Orders" column="orderCount" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-left"><SortButton label="Spent" column="totalSpent" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-left">Newsletter</th>
                  <th className="px-6 py-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                      <td className="px-6 py-4 font-semibold text-slate-900">{customer.name}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="space-y-1">
                          <p className="break-all">{customer.email}</p>
                          <p>{customer.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{customer.orderCount}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">{formatCurrency(customer.totalSpent)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${customer.isNewsletterSubscribed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {customer.isNewsletterSubscribed ? "Subscribed" : "Not subscribed"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(customer)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-50"
                          title="View customer details"
                          aria-label={`View details for ${customer.name}`}
                        >
                          <FileIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                      No customers match the current search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedCustomer.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{selectedCustomer.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close customer details"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6 p-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Orders</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">{selectedCustomer.orderCount}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Spent</p>
                    <p className="mt-3 text-3xl font-bold text-emerald-600">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Member Since</p>
                    <p className="mt-3 text-lg font-bold text-slate-900">{formatDate(selectedCustomer.createdAt)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
                  <div className="mt-4 space-y-4">
                    {selectedCustomer.orders.length ? (
                      selectedCustomer.orders.slice(0, 5).map((order) => (
                        <div key={order._id} className="rounded-xl border border-slate-200 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-bold text-slate-900">Order #{String(order._id).slice(-8).toUpperCase()}</p>
                              <p className="mt-1 text-sm text-slate-500">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                order.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                                order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                                order.status === "cancelled" ? "bg-rose-100 text-rose-700" :
                                "bg-amber-100 text-amber-700"
                              }`}>
                                {String(order.status || "pending").replace(/\b\w/g, (char) => char.toUpperCase())}
                              </span>
                              <p className="mt-3 text-lg font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                            </div>
                          </div>

                          {(order.items || []).length ? (
                            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                              {order.items.map((item, index) => (
                                <div key={`${order._id}:${index}`} className="flex items-start gap-4">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                                  ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-400">
                                      No image
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="font-semibold text-slate-900">{item.name}</p>
                                    {item.variantLabel ? <p className="mt-1 text-xs text-slate-500">{item.variantLabel}</p> : null}
                                    {item.optionValues && Object.keys(item.optionValues).length ? (
                                      <p className="mt-1 text-xs text-slate-500">
                                        {Object.entries(item.optionValues).map(([key, value]) => `${key}: ${value}`).join(" • ")}
                                      </p>
                                    ) : null}
                                    <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                                      <span>Qty: {item.quantity}</span>
                                      <span className="font-semibold text-slate-900">{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center text-blue-900">
                        This customer is subscribed or registered but has not placed any orders yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-bold text-slate-900">Contact Information</h3>
                  <div className="mt-4 space-y-4 text-sm text-slate-700">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
                      <p className="mt-1 break-all font-medium text-blue-700">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</p>
                      <p className="mt-1 font-medium text-slate-900">{selectedCustomer.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Newsletter</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedCustomer.isNewsletterSubscribed ? "Subscribed" : "Not subscribed"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Last Order</p>
                      <p className="mt-1 font-medium text-slate-900">{formatDate(selectedCustomer.lastOrderAt)}</p>
                    </div>
                  </div>
                </div>

                <AddressBlock title="Shipping Address" address={selectedCustomer.address} />
                <AddressBlock title="Billing Address" address={selectedCustomer.address} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
