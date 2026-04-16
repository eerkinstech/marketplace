"use client";

import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 30 minutes", value: "last30m" },
  { label: "Last 12 hours", value: "last12h" },
  { label: "Last 7 days", value: "last7d" },
  { label: "Last 30 days", value: "last30d" },
  { label: "Last 90 days", value: "last90d" },
  { label: "Last 365 days", value: "last365d" },
  { label: "Last 12 months", value: "last12m" },
  { label: "Last week", value: "lastweek" },
  { label: "Last month", value: "lastmonth" }
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(Number(value || 0));
}

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function getPresetRange(presetValue) {
  const now = new Date();
  let from;
  let to;

  switch (presetValue) {
    case "today":
      from = startOfDay(now);
      to = endOfDay(now);
      break;
    case "yesterday":
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
      to = endOfDay(from);
      break;
    case "last30m":
      from = new Date(now.getTime() - 30 * 60 * 1000);
      to = now;
      break;
    case "last12h":
      from = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      to = now;
      break;
    case "last7d":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      to = now;
      break;
    case "last30d":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      to = now;
      break;
    case "last90d":
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      to = now;
      break;
    case "last365d":
      from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      to = now;
      break;
    case "last12m":
      from = new Date(now);
      from.setFullYear(from.getFullYear() - 1);
      to = now;
      break;
    case "lastweek":
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7));
      to = endOfDay(new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6));
      break;
    case "lastmonth":
      from = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      to = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      break;
    default:
      from = startOfDay(now);
      to = endOfDay(now);
      break;
  }

  return { from, to };
}

function normalizeOptionValues(optionValues) {
  if (!optionValues) return {};
  if (optionValues instanceof Map) return Object.fromEntries(optionValues.entries());
  return Object.fromEntries(Object.entries(optionValues));
}

function getItemProductId(item) {
  if (!item) return "";
  if (typeof item.product === "object" && item.product?._id) return String(item.product._id);
  if (typeof item.product === "string") return item.product;
  return "";
}

function SortIndicator({ active, direction }) {
  return (
    <span className="ml-2 inline-flex flex-col align-middle text-[10px] leading-none">
      <span className={active && direction === "asc" ? "text-slate-900" : "text-slate-300"}>▲</span>
      <span className={active && direction === "desc" ? "text-slate-900" : "text-slate-300"}>▼</span>
    </span>
  );
}

function buildAnalytics(orders = [], products = [], dateFrom = "", dateTo = "") {
  const fromDate = dateFrom ? startOfDay(new Date(dateFrom)) : null;
  const toDate = dateTo ? endOfDay(new Date(dateTo)) : null;

  const filteredOrders = (orders || []).filter((order) => {
    const createdAt = new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime())) return false;
    if (fromDate && createdAt < fromDate) return false;
    if (toDate && createdAt > toDate) return false;
    return true;
  });

  const totalSales = filteredOrders.reduce(
    (sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    0
  );
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders ? totalSales / totalOrders : 0;

  const productMap = new Map();
  const variantQtyMap = {};

  filteredOrders.forEach((order) => {
    const orderId = String(order._id);

    (order.items || []).forEach((item) => {
      const productId = getItemProductId(item) || `${orderId}:${item.name}`;
      const productName = item.name || "Unknown Product";
      const compositeKey = `${productId}:${productName}`;
      const quantity = Number(item.quantity || 0);
      const originalPrice = Number(item.price || 0) * quantity;

      if (!productMap.has(compositeKey)) {
        productMap.set(compositeKey, {
          id: productId,
          name: productName,
          totalQty: 0,
          totalSale: 0,
          totalDiscount: 0,
          orderCount: 0,
          orderIds: new Set()
        });
      }

      const bucket = productMap.get(compositeKey);
      bucket.totalQty += quantity;
      bucket.totalSale += originalPrice;
      if (!bucket.orderIds.has(orderId)) {
        bucket.orderIds.add(orderId);
        bucket.orderCount += 1;
      }

      const optionValues = normalizeOptionValues(item.optionValues);
      const hasVariants = item.variantLabel || Object.keys(optionValues).length;
      if (hasVariants) {
        if (!variantQtyMap[productId]) {
          variantQtyMap[productId] = {};
        }

        const variantObject = item.variantLabel ? { Variant: item.variantLabel, ...optionValues } : optionValues;
        const variantKey = JSON.stringify(variantObject);

        if (!variantQtyMap[productId][variantKey]) {
          variantQtyMap[productId][variantKey] = { variant: variantObject, quantity: 0 };
        }

        variantQtyMap[productId][variantKey].quantity += quantity;
      }
    });
  });

  const rows = Array.from(productMap.values()).map((row) => ({
    ...row,
    grossSale: row.totalSale
  }));

  return {
    totalSales,
    totalOrders,
    totalProducts: products.length,
    avgOrderValue,
    rows,
    variantQtyMap
  };
}

export default function VendorAnalyticsPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to view analytics.");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("today");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variantBreakdown, setVariantBreakdown] = useState({});

  useEffect(() => {
    const { from, to } = getPresetRange("today");
    setDateFrom(toInputDate(from));
    setDateTo(toInputDate(to));
  }, []);

  useEffect(() => {
    async function load() {
      if (!token) return;

      try {
        setLoading(true);
        const [ordersResponse, productsResponse] = await Promise.all([
          marketplaceApi.getVendorOrders(token),
          marketplaceApi.getVendorProducts(token)
        ]);

        setOrders(ordersResponse.data || []);
        setProducts(productsResponse.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, setError]);

  const analytics = useMemo(
    () => buildAnalytics(orders, products, dateFrom, dateTo),
    [orders, products, dateFrom, dateTo]
  );

  const rows = useMemo(() => {
    const nextRows = [...analytics.rows];

    nextRows.sort((left, right) => {
      if (sortColumn === "gross") {
        return sortDirection === "asc" ? left.grossSale - right.grossSale : right.grossSale - left.grossSale;
      }

      if (sortColumn === "orders") {
        return sortDirection === "asc" ? left.orderCount - right.orderCount : right.orderCount - left.orderCount;
      }

      return right.grossSale - left.grossSale;
    });

    return nextRows;
  }, [analytics.rows, sortColumn, sortDirection]);

  function applyPreset(value) {
    const { from, to } = getPresetRange(value);
    setSelectedPreset(value);
    setDateFrom(toInputDate(from));
    setDateTo(toInputDate(to));
  }

  function toggleSort(column) {
    if (sortColumn === column) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }

    setSortColumn(column);
    setSortDirection("asc");
  }

  return (
    <div className="min-w-0 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Analytics Dashboard</h1>
        <p className="mt-2 text-slate-600">Track sales, orders, and best-performing products for your store.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={() => setShowDatePicker((current) => !current)}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          {showDatePicker ? "Hide" : "Show"} Date Filter
        </button>

        {showDatePicker ? (
          <div className="mt-5 grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="border-b border-slate-200 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
              <div className="text-xs font-semibold   tracking-[0.18em] text-slate-500">Quick Select</div>
              <div className="mt-3 space-y-2">
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => applyPreset(preset.value)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedPreset === preset.value ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold   tracking-[0.18em] text-slate-500">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => {
                      setSelectedPreset("");
                      setDateFrom(event.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold   tracking-[0.18em] text-slate-500">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => {
                      setSelectedPreset("");
                      setDateTo(event.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDatePicker(false);
                    setSelectedPreset("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4 2xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold   text-slate-500">Revenue</p>
              <p className="mt-3 text-3xl font-bold text-blue-600">{formatCurrency(analytics.totalSales)}</p>
              <p className="mt-2 text-sm text-slate-500">Sales in selected range</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold   text-slate-500">Orders</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{analytics.totalOrders}</p>
              <p className="mt-2 text-sm text-slate-500">Orders containing your products</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold   text-slate-500">Products</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{analytics.totalProducts}</p>
              <p className="mt-2 text-sm text-slate-500">Products currently in your catalog</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold   text-slate-500">Avg. Order Value</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{formatCurrency(analytics.avgOrderValue)}</p>
              <p className="mt-2 text-sm text-slate-500">Average value per vendor order</p>
            </div>
          </div>

          <div className="max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 10h18" />
                  <path d="M8 4v16" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Orders Details</h2>
                <p className="text-sm text-slate-500">Grouped by your products with gross sales and order count.</p>
              </div>
            </div>

            <div className="max-w-full overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm md:min-w-[860px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left   tracking-[0.18em] text-slate-500">
                    <th className="py-3 pr-4">Product Name</th>
                    <th className="cursor-pointer py-3 px-4 text-right" onClick={() => toggleSort("gross")}>
                      <span className="inline-flex items-center justify-end">
                        Gross Sale
                        <SortIndicator active={sortColumn === "gross"} direction={sortDirection} />
                      </span>
                    </th>
                    <th className="cursor-pointer py-3 px-4 text-center" onClick={() => toggleSort("orders")}>
                      <span className="inline-flex items-center justify-center">
                        Orders
                        <SortIndicator active={sortColumn === "orders"} direction={sortDirection} />
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right">Original Price</th>
                    <th className="py-3 pl-4 text-right">Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? rows.map((product) => {
                    const variants = analytics.variantQtyMap[product.id];
                    const hasVariants = variants && Object.keys(variants).length > 0;

                    return (
                      <tr key={`${product.id}:${product.name}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="py-4 pr-4">
                          <button
                            type="button"
                            disabled={!hasVariants}
                            onClick={() => {
                              if (!hasVariants) return;
                              setSelectedProduct({ id: product.id, name: product.name });
                              setVariantBreakdown(variants);
                            }}
                            className={`text-left font-semibold ${hasVariants ? "text-blue-700 hover:underline" : "text-slate-900"} disabled:cursor-default`}
                          >
                            {product.name}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-emerald-600">{formatCurrency(product.grossSale)}</td>
                        <td className="py-4 px-4 text-center font-semibold text-blue-700">{product.orderCount}</td>
                        <td className="py-4 px-4 text-right font-semibold text-slate-900">{formatCurrency(product.totalSale)}</td>
                        <td className="py-4 pl-4 text-right font-semibold text-rose-600">-{formatCurrency(product.totalDiscount)}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-slate-500">No orders found for the selected period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedProduct && Object.keys(variantBreakdown).length ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedProduct.name} Variants</h2>
                <p className="mt-1 text-sm text-slate-500">Breakdown by quantity sold</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setVariantBreakdown({});
                }}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close variants modal"
              >
                X
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {Object.values(variantBreakdown).map((item, index) => (
                <div key={`${selectedProduct.id}:${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="pr-4 text-sm text-slate-700">
                    {Object.entries(item.variant || {}).map(([key, value]) => `${key}: ${value}`).join(", ") || "Default"}
                  </span>
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">{item.quantity}x</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedProduct(null);
                setVariantBreakdown({});
              }}
              className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
