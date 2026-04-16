"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const initialForm = {
  title: "",
  message: "",
  audience: "vendors",
  targetVendorIds: [],
  isActive: true,
  startsAt: "",
  endsAt: ""
};

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString();
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (entry) => String(entry).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminAnnouncementsPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage announcements.");
  const [announcements, setAnnouncements] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [announcementsResponse, vendorsResponse] = await Promise.all([
        marketplaceApi.getAdminAnnouncements(token),
        marketplaceApi.getAdminVendors(token)
      ]);

      setAnnouncements(Array.isArray(announcementsResponse?.data) ? announcementsResponse.data : []);
      setVendors(Array.isArray(vendorsResponse?.data) ? vendorsResponse.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  const metrics = useMemo(() => ([
    { title: String(announcements.length), description: "Total announcements" },
    { title: String(announcements.filter((item) => item.isActive !== false).length), description: "Active announcements" },
    { title: String(vendors.length), description: "Vendors available" }
  ]), [announcements, vendors]);

  function resetForm() {
    setEditingId("");
    setForm(initialForm);
  }

  function startEdit(item) {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      message: item.message || "",
      audience: item.audience || "vendors",
      targetVendorIds: Array.isArray(item.targetVendors) ? item.targetVendors.map((vendor) => vendor._id) : [],
      isActive: item.isActive !== false,
      startsAt: toDatetimeLocal(item.startsAt),
      endsAt: toDatetimeLocal(item.endsAt)
    });
  }

  function toggleVendor(vendorId) {
    setForm((current) => ({
      ...current,
      targetVendorIds: current.targetVendorIds.includes(vendorId)
        ? current.targetVendorIds.filter((id) => id !== vendorId)
        : [...current.targetVendorIds, vendorId]
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        targetVendorIds: form.audience === "vendors" ? form.targetVendorIds : [],
        isActive: Boolean(form.isActive),
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined
      };

      if (!payload.title) throw new Error("Announcement title is required.");
      if (!payload.message || payload.message.length < 10) throw new Error("Announcement message must be at least 10 characters.");

      if (editingId) {
        await marketplaceApi.updateAnnouncement(token, editingId, payload);
        toast.success("Announcement updated");
      } else {
        await marketplaceApi.createAnnouncement(token, payload);
        toast.success("Announcement created");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Unable to save announcement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-6">
      <div>
        <div className="eyebrow">Admin</div>
        <h1 className="page-title">Announcements</h1>
        <p className="mt-2 text-sm text-slate-600">
          Send marketplace-wide messages or target only selected vendors about their stores and operations.
        </p>
      </div>

      {error ? <div className="card section small">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <SectionCard key={metric.description} title={metric.title} description={metric.description} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.15fr]">
        <SectionCard
          title={editingId ? "Edit announcement" : "Create announcement"}
          description="Choose the audience, write the message, and optionally target specific vendors."
        >
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Title</span>
              <input
                className="field-input"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Holiday dispatch update"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Audience</span>
              <select
                className="field-input"
                value={form.audience}
                onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value, targetVendorIds: event.target.value === "vendors" ? current.targetVendorIds : [] }))}
              >
                <option value="vendors">Vendors</option>
                <option value="customers">Customers</option>
                <option value="all">All users</option>
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-ink">Starts at</span>
                <input
                  type="datetime-local"
                  className="field-input"
                  value={form.startsAt}
                  onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-ink">Ends at</span>
                <input
                  type="datetime-local"
                  className="field-input"
                  value={form.endsAt}
                  onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Message</span>
              <textarea
                className="field-input min-h-[140px]"
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Write the announcement"
              />
            </label>

            <label className="inline-flex items-center gap-3 rounded-2xl border border-black/8 bg-slate-50 px-4 py-3 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Announcement is active
            </label>

            {form.audience === "vendors" ? (
              <div className="grid gap-3 rounded-2xl border border-black/8 bg-slate-50/70 p-4">
                <div>
                  <div className="text-sm font-semibold text-ink">Target vendors</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Leave all unchecked to send to every vendor, or pick specific stores below.
                  </div>
                </div>

                <div className="grid max-h-[260px] gap-2 overflow-y-auto pr-1">
                  {vendors.map((vendor) => {
                    const checked = form.targetVendorIds.includes(vendor._id);
                    return (
                      <label key={vendor._id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${checked ? "border-slate-900 bg-white" : "border-black/8 bg-white/70 hover:bg-white"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleVendor(vendor._id)} className="mt-1" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{vendor.storeName || vendor.name || vendor.email}</div>
                          <div className="mt-1 text-xs text-slate-500">{vendor.email}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Saving..." : editingId ? "Update announcement" : "Send announcement"}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                {editingId ? "Cancel edit" : "Reset"}
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Announcement library"
          description="Review active notices and who receives them."
        >
          {loading ? (
            <div className="rounded-2xl border border-dashed border-black/10 px-4 py-12 text-center text-sm text-slate-500">
              Loading announcements...
            </div>
          ) : announcements.length ? (
            <div className="grid gap-3">
              {announcements.map((item) => (
                <article key={item._id} className="rounded-2xl border border-black/8 bg-white px-4 py-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base font-semibold text-slate-900">{item.title}</div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                          {item.isActive !== false ? "Active" : "Inactive"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {item.audience}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-600">{item.message}</p>

                      <div className="mt-3 grid gap-1 text-xs text-slate-500">
                        <div>Starts: {formatDate(item.startsAt)}</div>
                        <div>Ends: {formatDate(item.endsAt)}</div>
                        <div>
                          Recipients: {item.audience === "vendors"
                            ? Array.isArray(item.targetVendors) && item.targetVendors.length
                              ? item.targetVendors.map((vendor) => vendor.storeName || vendor.name || vendor.email).join(", ")
                              : "All vendors"
                            : item.audience === "customers"
                              ? "All customers"
                              : "Everyone"}
                        </div>
                      </div>
                    </div>

                    <button type="button" onClick={() => startEdit(item)} className="btn-secondary">
                      Edit
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/10 px-4 py-12 text-center text-sm text-slate-500">
              No announcements created yet.
            </div>
          )}
        </SectionCard>
      </div>
    </section>
  );
}
