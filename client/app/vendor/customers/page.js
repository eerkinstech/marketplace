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

function buildVendorCustomers(orders = [], customers = []) {
  const customerMap = new Map();

  function ensureCustomer(key, payload) {
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        id: payload.id || key,
        email: payload.email || "Unknown",
        name: payload.name || "Customer",
        phone: payload.phone || "N/A",
        address: payload.address || null,
        orders: [],
        totalSpent: 0,
        orderCount: 0,
        unitsPurchased: 0,
        createdAt: payload.createdAt || null,
        lastOrderAt: null
      });
    }

    return customerMap.get(key);
  }

  (orders || []).forEach((order) => {
    const email = String(order.customerEmail || order.user?.email || "").trim().toLowerCase();
    const name = order.customerName || order.user?.name || "Customer";
    const phone = order.customerPhone || order.shippingAddress?.phone || "N/A";
    const key = email || String(order.user?._id || order._id);

    const customer = ensureCustomer(key, {
      id: order.user?._id || key,
      email: email || order.customerEmail || "Unknown",
      name,
      phone,
      address: order.shippingAddress || order.billingAddress || null,
      createdAt: order.createdAt
    });

    customer.orders.push(order);
    customer.orderCount += 1;
    customer.unitsPurchased += (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    customer.totalSpent += (order.items || []).reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
    customer.lastOrderAt = !customer.lastOrderAt || new Date(order.createdAt) > new Date(customer.lastOrderAt)
      ? order.createdAt
      : customer.lastOrderAt;
    customer.createdAt = !customer.createdAt || new Date(order.createdAt) < new Date(customer.createdAt)
      ? order.createdAt
      : customer.createdAt;
  });

  (customers || []).forEach((customerRecord) => {
    const email = String(customerRecord.email || "").trim().toLowerCase();
    const key = email || String(customerRecord._id);
    const customer = ensureCustomer(key, {
      id: customerRecord._id,
      email: customerRecord.email || "Unknown",
      name: customerRecord.name || "Customer",
      createdAt: customerRecord.createdAt
    });

    customer.name = customer.name || customerRecord.name || "Customer";
    customer.createdAt = customer.createdAt || customerRecord.createdAt;
    customer.totalSpent = customer.totalSpent || Number(customerRecord.totalSpent || 0);
    customer.orderCount = customer.orderCount || Number(customerRecord.orderCount || 0);
    customer.unitsPurchased = customer.unitsPurchased || Number(customerRecord.unitsPurchased || 0);
    customer.lastOrderAt = customer.lastOrderAt || customerRecord.lastOrderAt || null;
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
        <p>{[address.city, address.state, address.postalCode].filter(Boolean).join(", ") || "No city or postal code"}</p>
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

export default function VendorCustomersPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to view customer data.");
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
        const [ordersResponse, customersResponse] = await Promise.all([
          marketplaceApi.getVendorOrders(token),
          marketplaceApi.getVendorCustomers(token)
        ]);

        setCustomers(buildVendorCustomers(ordersResponse.data || [], customersResponse.data || []));
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
    const visible = query
      ? customers.filter((customer) =>
          [customer.name, customer.email, customer.phone]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        )
      : customers;

    return [...visible].sort((left, right) => {
      const direction = sortConfig.order === "asc" ? 1 : -1;
      const leftValue = left[sortConfig.key];
      const rightValue = right[sortConfig.key];

      if (typeof leftValue === "string" || typeof rightValue === "string") {
        return String(leftValue || "").localeCompare(String(rightValue || "")) * direction;
      }

      return (Number(leftValue || 0) - Number(rightValue || 0)) * direction;
    });
  }, [customers, search, sortConfig]);

  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    totalRevenue: customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0),
    totalUnits: customers.reduce((sum, customer) => sum + Number(customer.unitsPurchased || 0), 0)
  }), [customers]);

  function handleSort(key) {
    setSortConfig((current) => ({
      key,
      order: current.key === key && current.order === "asc" ? "desc" : "asc"
    }));
  }

  return (
    <div className="min-w-0 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Customers</h1>
        <p className="mt-2 text-slate-600">See who buys from your store and inspect their order history.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">Loading customers...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Total Customers</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalCustomers}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Revenue From Customers</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Units Sold</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalUnits}</p>
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

          <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-700">Contact</th>
                  <th className="px-6 py-4 text-left"><SortButton label="Orders" column="orderCount" sortConfig={sortConfig} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-left"><SortButton label="Spent" column="totalSpent" sortConfig={sortConfig} onSort={handleSort} /></th>
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
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">No customers match the current search.</td>
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
                X
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
                    {selectedCustomer.orders.length ? selectedCustomer.orders.slice(0, 5).map((order) => (
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
                            <p className="mt-3 text-lg font-bold text-slate-900">
                              {formatCurrency((order.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0))}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                          {(order.items || []).map((item, index) => (
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
                                {item.optionValues ? (
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
                      </div>
                    )) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">No orders found for this customer.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-bold text-slate-900">Customer Information</h3>
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
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Last Order</p>
                      <p className="mt-1 font-medium text-slate-900">{formatDate(selectedCustomer.lastOrderAt)}</p>
                    </div>
                  </div>
                </div>

                <AddressBlock title="Shipping Address" address={selectedCustomer.address} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
