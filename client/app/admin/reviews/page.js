"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { API_URL } from "@/lib/constants/site";

const TAB_ALL = "all";
const TAB_BY_PRODUCT = "by-product";
const FILTERS = ["all", "approved", "pending", "rejected"];

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function normalizeReview(row) {
  return {
    ...row,
    productId: row?.product?._id || "",
    productName: row?.product?.name || "Deleted product",
    userName: row?.user?.name || row?.guestName || "Customer",
    userEmail: row?.user?.email || row?.guestEmail || "Guest",
    status: row?.status || (row?.isApproved ? "approved" : "pending"),
    isApproved: row?.status === "approved" || row?.isApproved === true
  };
}

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === "\"") {
      if (insideQuotes && nextChar === "\"") {
        current += "\"";
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function normalizeHeader(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function getFieldValue(record, key) {
  const normalizedKey = normalizeHeader(key);
  return Object.entries(record).find(([field]) => normalizeHeader(field) === normalizedKey)?.[1] || "";
}

function ReviewStars({ rating = 0 }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-4 w-4 ${index < safeRating ? "text-amber-400" : "text-slate-300"}`}
          fill={index < safeRating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.95l-5.4 2.84 1.03-6.01-4.36-4.25 6.03-.88L12 3Z" />
        </svg>
      ))}
    </div>
  );
}

function statusClass(status = "") {
  if (status === "approved") return "bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-800";
}

export default function AdminReviewsPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage reviews.");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState(TAB_ALL);
  const [filterTab, setFilterTab] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [requireReviewApproval, setRequireReviewApproval] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingReviewId, setSavingReviewId] = useState("");

  useEffect(() => {
    if (!token) return;

    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        const [reviewsResponse, productsResponse, settingsResponse] = await Promise.all([
          marketplaceApi.getAdminReviews(token),
          marketplaceApi.getAdminProducts(token),
          marketplaceApi.getAdminReviewSettings(token)
        ]);

        if (ignore) return;

        setRows((reviewsResponse?.data || []).map(normalizeReview));
        setProducts(productsResponse?.data || []);
        setRequireReviewApproval(settingsResponse?.data?.requireReviewApproval !== false);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [token, refreshKey, setError]);

  const counts = useMemo(() => {
    const total = rows.length;
    const approved = rows.filter((row) => row.status === "approved").length;
    const pending = rows.filter((row) => row.status === "pending").length;
    const rejected = rows.filter((row) => row.status === "rejected").length;
    return { total, approved, pending, rejected };
  }, [rows]);

  const visibleRows = useMemo(() => {
    let nextRows = rows;

    if (activeTab === TAB_BY_PRODUCT) {
      nextRows = selectedProduct ? nextRows.filter((row) => row.productId === selectedProduct) : [];
    }

    if (filterTab !== "all") {
      nextRows = nextRows.filter((row) => row.status === filterTab);
    }

    const query = search.trim().toLowerCase();
    if (query) {
      nextRows = nextRows.filter((row) =>
        [row.userName, row.userEmail, row.productName, row.comment]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      );
    }

    return nextRows;
  }, [activeTab, filterTab, rows, search, selectedProduct]);

  function triggerRefresh() {
    setRefreshKey((current) => current + 1);
  }

  async function toggleRequireApproval() {
    try {
      setSavingSettings(true);
      const response = await marketplaceApi.updateAdminReviewSettings(token, {
        requireReviewApproval: !requireReviewApproval
      });
      const nextValue = response?.data?.requireReviewApproval !== false;
      setRequireReviewApproval(nextValue);
      toast.success(
        nextValue
          ? "Reviews will now require approval before showing."
          : "Reviews will now show immediately without approval."
      );
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSavingSettings(false);
    }
  }

  async function updateStatus(reviewId, status, moderationNote = "") {
    try {
      setSavingReviewId(reviewId);
      const response = await marketplaceApi.updateAdminReviewStatus(token, reviewId, {
        status,
        moderationNote
      });
      const updated = normalizeReview(response?.data || {});
      setRows((current) => current.map((row) => (row._id === reviewId ? updated : row)));
      toast.success(
        status === "approved"
          ? "Review verified"
          : status === "pending"
            ? "Review moved to pending"
            : "Review rejected"
      );
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSavingReviewId("");
    }
  }

  async function deleteReview(reviewId) {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      setSavingReviewId(reviewId);
      await marketplaceApi.deleteAdminReview(token, reviewId);
      setRows((current) => current.filter((row) => row._id !== reviewId));
      toast.success("Review deleted");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSavingReviewId("");
    }
  }

  function exportReviews() {
    try {
      const headers = [
        "Review ID",
        "Product Name",
        "Product ID",
        "User Name",
        "User Email",
        "Rating",
        "Comment",
        "Status",
        "Created At"
      ];

      const rowsToExport = visibleRows.map((row) => [
        row._id || "",
        `"${String(row.productName || "").replace(/"/g, "\"\"")}"`,
        row.productId || "",
        `"${String(row.userName || "").replace(/"/g, "\"\"")}"`,
        row.userEmail || "",
        row.rating || "0",
        `"${String(row.comment || "").replace(/"/g, "\"\"").replace(/\n/g, " ")}"`,
        row.status || "pending",
        row.createdAt ? new Date(row.createdAt).toLocaleString() : ""
      ]);

      const csvContent = [headers.join(","), ...rowsToExport.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `marketplace_reviews_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${visibleRows.length} review(s) successfully`);
    } catch {
      toast.error("Failed to export reviews");
    }
  }

  async function handleImportReviews(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const lines = text.trim().split(/\r?\n/);

      if (lines.length < 2) {
        toast.error("CSV file must have headers and at least one review row");
        event.target.value = "";
        return;
      }

      const headers = parseCSVLine(lines[0]).map(normalizeHeader);
      let importedCount = 0;
      let failedCount = 0;
      let duplicateCount = 0;

      for (let index = 1; index < lines.length; index += 1) {
        const line = lines[index].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const reviewData = {};
        headers.forEach((header, headerIndex) => {
          reviewData[header] = values[headerIndex] || "";
        });

        const productId = getFieldValue(reviewData, "product id");
        const comment = getFieldValue(reviewData, "comment");
        const rating = Number.parseInt(getFieldValue(reviewData, "rating"), 10) || 0;
        const status = String(getFieldValue(reviewData, "status") || "pending").toLowerCase();
        const userName = getFieldValue(reviewData, "user name") || "Imported Review";
        const userEmail = String(getFieldValue(reviewData, "user email") || "").toLowerCase().trim();

        if (!productId || !comment || !rating || !userEmail) {
          failedCount += 1;
          continue;
        }

        const exists = rows.some(
          (row) => row.productId === productId && String(row.userEmail || "").toLowerCase().trim() === userEmail
        );
        if (exists) {
          duplicateCount += 1;
          continue;
        }

        try {
          const createResponse = await fetch(`${API_URL}/catalog/products/${productId}/reviews`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: userName,
              email: userEmail,
              rating,
              comment
            })
          });

          const createData = await createResponse.json().catch(() => ({}));
          if (!createResponse.ok) {
            const message = createData?.message || "";
            if (message.toLowerCase().includes("already")) duplicateCount += 1;
            else failedCount += 1;
            continue;
          }

          const createdReview = createData?.data || {};
          const desiredStatus = FILTERS.includes(status) ? status : "pending";
          if (createdReview?._id && desiredStatus !== (createdReview.status || "pending")) {
            await marketplaceApi.updateAdminReviewStatus(token, createdReview._id, {
              status: desiredStatus,
              moderationNote: "Imported from CSV"
            });
          }

          importedCount += 1;
        } catch {
          failedCount += 1;
        }
      }

      toast.success(
        `Imported ${importedCount} review(s)${failedCount ? ` (${failedCount} failed)` : ""}${duplicateCount ? ` (${duplicateCount} skipped - duplicates)` : ""}`
      );
      triggerRefresh();
    } catch (err) {
      toast.error(err.message || "Failed to import reviews");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section className="container page-section stack">
      <div className="card page-hero grid gap-8">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Admin</div>
            <h1 className="page-title mt-3">Reviews management</h1>
            <p className="muted-copy mt-4 max-w-3xl">
              Moderate storefront feedback, control whether new reviews need approval, and manage reviews across all products or a single product.
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={triggerRefresh}>
            Refresh reviews
          </button>
        </div>

        <div className="rounded-[24px] border border-black/8 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Review approval setting</div>
              <p className="mt-2 text-sm text-slate-600">
                {requireReviewApproval
                  ? "Reviews require admin approval before they appear on product pages."
                  : "Reviews appear immediately without requiring approval."}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleRequireApproval}
              disabled={savingSettings}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white ${savingSettings ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-700"}`}
            >
              {savingSettings ? "Saving..." : requireReviewApproval ? "Approval Required" : "No Approval Required"}
            </button>
          </div>
        </div>

        <div className="metric-grid">
          <div className="stat-chip">
            <div className="mini-label">Total reviews</div>
            <div className="mt-3 text-3xl font-semibold text-ink">{counts.total}</div>
            <div className="mt-2 text-sm text-slate-600">All review submissions</div>
          </div>
          <div className="stat-chip">
            <div className="mini-label">Verified</div>
            <div className="mt-3 text-3xl font-semibold text-emerald-700">{counts.approved}</div>
            <div className="mt-2 text-sm text-slate-600">Visible on product pages</div>
          </div>
          <div className="stat-chip">
            <div className="mini-label">Pending</div>
            <div className="mt-3 text-3xl font-semibold text-amber-700">{counts.pending}</div>
            <div className="mt-2 text-sm text-slate-600">Waiting moderation</div>
          </div>
          <div className="stat-chip">
            <div className="mini-label">Rejected</div>
            <div className="mt-3 text-3xl font-semibold text-rose-700">{counts.rejected}</div>
            <div className="mt-2 text-sm text-slate-600">Hidden from storefront</div>
          </div>
        </div>
      </div>

      {error ? <div className="card section small">{error}</div> : null}

      <div className="card section grid gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab(TAB_ALL);
                setSelectedProduct("");
              }}
              className={activeTab === TAB_ALL ? "btn-primary" : "btn-secondary"}
            >
              All reviews
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(TAB_BY_PRODUCT)}
              className={activeTab === TAB_BY_PRODUCT ? "btn-primary" : "btn-secondary"}
            >
              Reviews by product
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
              Import reviews
              <input type="file" accept=".csv" onChange={handleImportReviews} className="hidden" />
            </label>
            <button
              type="button"
              onClick={exportReviews}
              disabled={!visibleRows.length}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold ${visibleRows.length ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-500"}`}
            >
              Export reviews
            </button>
          </div>
        </div>

        <input
          type="text"
          className="field-input max-w-2xl"
          placeholder="Search by product, customer, email, or comment"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="flex flex-wrap gap-2 border-b border-black/8 pb-3">
          <button type="button" onClick={() => setFilterTab("all")} className={filterTab === "all" ? "btn-primary" : "btn-secondary"}>
            All ({counts.total})
          </button>
          <button type="button" onClick={() => setFilterTab("approved")} className={filterTab === "approved" ? "btn-primary" : "btn-secondary"}>
            Verified ({counts.approved})
          </button>
          <button type="button" onClick={() => setFilterTab("pending")} className={filterTab === "pending" ? "btn-primary" : "btn-secondary"}>
            Pending ({counts.pending})
          </button>
          <button type="button" onClick={() => setFilterTab("rejected")} className={filterTab === "rejected" ? "btn-primary" : "btn-secondary"}>
            Rejected ({counts.rejected})
          </button>
        </div>

        {activeTab === TAB_BY_PRODUCT ? (
          <div className="max-w-2xl">
            <label className="mb-3 block text-sm font-semibold text-slate-700">Select product</label>
            <select
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(event.target.value)}
              className="field-input h-12 w-full rounded-2xl border border-black/10 bg-white px-4"
            >
              <option value="">-- Choose a product --</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[24px] border border-black/8 bg-white p-10 text-center text-slate-500">Loading reviews...</div>
        ) : visibleRows.length ? (
          <div className="space-y-5">
            {visibleRows.map((row) => {
              const isBusy = savingReviewId === row._id;

              return (
                <article key={row._id} className="rounded-[24px] border border-black/8 bg-white p-6 shadow-[0_12px_32px_rgba(16,32,26,0.05)]">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-ink">{row.userName}</h3>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(row.status)}`}>
                          {row.status === "approved" ? "Verified" : row.status === "pending" ? "Pending" : "Rejected"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        Product: <span className="text-ink">{row.productName}</span>
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{row.userEmail}</p>
                    </div>

                    <div className="text-left lg:text-right">
                      <div className="flex items-center gap-2 lg:justify-end">
                        <ReviewStars rating={row.rating} />
                        <span className="text-sm font-semibold text-slate-600">{row.rating}/5</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{formatDate(row.createdAt || row.updatedAt)}</p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-700">{row.comment}</p>

                  <div className="mt-5 flex flex-wrap gap-3 border-t border-black/8 pt-5">
                    <button
                      type="button"
                      onClick={() => updateStatus(row._id, row.status === "approved" ? "pending" : "approved")}
                      disabled={isBusy}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold ${row.status === "approved" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-slate-100 text-slate-800 hover:bg-slate-200"} ${isBusy ? "opacity-60" : ""}`}
                    >
                      {row.status === "approved" ? "Unverify" : "Verify"}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(row._id, "rejected")}
                      disabled={isBusy || row.status === "rejected"}
                      className={`rounded-2xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200 ${isBusy || row.status === "rejected" ? "opacity-60" : ""}`}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReview(row._id)}
                      disabled={isBusy}
                      className={`rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 ${isBusy ? "opacity-60" : ""}`}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-black/8 bg-white p-10 text-center">
            <div className="text-lg font-semibold text-slate-700">No reviews found</div>
            <p className="mt-2 text-sm text-slate-500">
              {activeTab === TAB_BY_PRODUCT && selectedProduct
                ? "This product has no reviews yet."
                : filterTab === "approved"
                  ? "No verified reviews yet."
                  : filterTab === "pending"
                    ? "No pending reviews."
                    : filterTab === "rejected"
                      ? "No rejected reviews."
                      : "No reviews to manage."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
