"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { SectionCard } from "@/components/dashboard/SectionCard";

const permissionGroups = [
  { label: "Main", permissions: ["dashboard"] },
  { label: "Products & Inventory", permissions: ["products", "inventory", "categories", "collections"] },
  { label: "Content", permissions: ["media", "menu", "sliders", "pages", "pages-seo", "redirects"] },
  { label: "Sales", permissions: ["orders", "returns", "customers", "coupons", "vendors", "shipping", "payments"] },
  { label: "Engagement", permissions: ["reviews", "chat", "emails"] },
  { label: "Settings & Access", permissions: ["analytics", "roles", "settings"] }
];

const allPermissions = permissionGroups.flatMap((group) => group.permissions);

const initialForm = {
  name: "",
  description: "",
  permissions: [],
  isActive: true
};

const initialEmployeeForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  status: "active",
  customRoleId: ""
};

export default function AdminRolesPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage roles.");
  const [roles, setRoles] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [employeeForm, setEmployeeForm] = useState(initialEmployeeForm);
  const [assigningUserId, setAssigningUserId] = useState("");
  const [creatingEmployee, setCreatingEmployee] = useState(false);

  async function loadData() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [rolesResponse, adminsResponse] = await Promise.all([
        marketplaceApi.getAdminRoles(token),
        marketplaceApi.getAdminUsers(token)
      ]);
      setRoles(Array.isArray(rolesResponse?.data) ? rolesResponse.data : []);
      setAdminUsers(Array.isArray(adminsResponse?.data) ? adminsResponse.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) =>
      [role.name, role.description, ...(role.permissions || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [roles, search]);

  const metrics = useMemo(() => ([
    { title: String(roles.length), description: "Custom roles" },
    { title: String(adminUsers.filter((user) => user.customRole?._id).length), description: "Admins with assigned roles" },
    { title: String(allPermissions.length), description: "Permission keys available" }
  ]), [roles, adminUsers]);

  function resetForm() {
    setEditingId("");
    setForm(initialForm);
  }

  function resetEmployeeForm() {
    setEmployeeForm(initialEmployeeForm);
  }

  function startEdit(role) {
    setEditingId(role._id);
    setForm({
      name: role.name || "",
      description: role.description || "",
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      isActive: role.isActive !== false
    });
  }

  function togglePermission(permission) {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission]
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        permissions: [...new Set(form.permissions)].sort(),
        isActive: Boolean(form.isActive)
      };

      if (!payload.name) throw new Error("Role name is required.");
      if (!payload.permissions.length) throw new Error("Select at least one permission.");

      if (editingId) {
        await marketplaceApi.updateAdminRole(token, editingId, payload);
        toast.success("Role updated");
      } else {
        await marketplaceApi.createAdminRole(token, payload);
        toast.success("Role created");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Unable to save role");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role) {
    if (!token) return;
    if (!window.confirm(`Delete role ${role.name}? Assigned admins will lose this custom role.`)) return;

    try {
      setDeletingId(role._id);
      setError("");
      await marketplaceApi.deleteAdminRole(token, role._id);
      toast.success("Role deleted");
      if (editingId === role._id) resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Unable to delete role");
    } finally {
      setDeletingId("");
    }
  }

  async function assignRole(userId, customRoleId) {
    if (!token) return;

    try {
      setAssigningUserId(userId);
      await marketplaceApi.assignAdminUserRole(token, userId, {
        customRoleId: customRoleId || null
      });
      toast.success("Admin role assignment updated");
      await loadData();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Unable to assign role");
    } finally {
      setAssigningUserId("");
    }
  }

  async function handleCreateEmployee(event) {
    event.preventDefault();
    if (!token) return;

    try {
      setCreatingEmployee(true);
      setError("");

      const payload = {
        name: employeeForm.name.trim(),
        email: employeeForm.email.trim().toLowerCase(),
        password: employeeForm.password,
        phone: employeeForm.phone.trim(),
        status: employeeForm.status,
        customRoleId: employeeForm.customRoleId || null
      };

      if (!payload.name) throw new Error("Employee name is required.");
      if (!payload.email) throw new Error("Employee email is required.");
      if (!payload.password || payload.password.length < 8) throw new Error("Password must be at least 8 characters.");

      await marketplaceApi.createAdminUser(token, payload);
      toast.success("Employee created");
      resetEmployeeForm();
      await loadData();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Unable to create employee");
    } finally {
      setCreatingEmployee(false);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Admin</div>
          <h1 className="page-title">Roles & Permissions</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create custom access profiles and assign them to admin users for sidebar-level permission control.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <SectionCard key={metric.description} title={metric.title} description={metric.description} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <SectionCard
          title={editingId ? "Edit role" : "Create role"}
          description="Choose the permission keys this role should expose inside the admin sidebar."
        >
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Role name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Content Manager"
                className="field-input"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Optional summary of what this role can access"
                rows={3}
                className="field-input min-h-[100px]"
              />
            </label>

            <label className="inline-flex items-center gap-3 rounded-2xl border border-black/8 bg-slate-50 px-4 py-3 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Role is active
            </label>

            <div className="grid gap-4">
              {permissionGroups.map((group) => (
                <div key={group.label} className="rounded-2xl border border-black/8 bg-slate-50/70 p-4">
                  <div className="text-sm font-semibold text-ink">{group.label}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.permissions.map((permission) => {
                      const selected = form.permissions.includes(permission);
                      return (
                        <button
                          key={permission}
                          type="button"
                          onClick={() => togglePermission(permission)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${selected
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                          {permission}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Saving..." : editingId ? "Update role" : "Create role"}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                {editingId ? "Cancel edit" : "Reset"}
              </button>
            </div>
          </form>
        </SectionCard>

        <div className="grid gap-6">
          <SectionCard
            title="Create employee"
            description="Create a new employee login and optionally attach a custom admin role."
          >
            <form onSubmit={handleCreateEmployee} className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-ink">Full name</span>
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(event) => setEmployeeForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ayesha Khan"
                  className="field-input"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-ink">Email</span>
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={(event) => setEmployeeForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="employee@example.com"
                  className="field-input"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-ink">Password</span>
                <input
                  type="password"
                  value={employeeForm.password}
                  onChange={(event) => setEmployeeForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Minimum 8 characters"
                  className="field-input"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-ink">Phone</span>
                <input
                  type="text"
                  value={employeeForm.phone}
                  onChange={(event) => setEmployeeForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Optional"
                  className="field-input"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-ink">Status</span>
                  <select
                    value={employeeForm.status}
                    onChange={(event) => setEmployeeForm((current) => ({ ...current, status: event.target.value }))}
                    className="field-input"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-ink">Custom role</span>
                  <select
                    value={employeeForm.customRoleId}
                    onChange={(event) => setEmployeeForm((current) => ({ ...current, customRoleId: event.target.value }))}
                    className="field-input"
                  >
                    <option value="">Full admin access</option>
                    {roles.filter((role) => role.isActive !== false).map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={creatingEmployee} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
                  {creatingEmployee ? "Creating..." : "Create employee"}
                </button>
                <button type="button" onClick={resetEmployeeForm} className="btn-secondary">
                  Reset
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Role library"
            description="Search existing roles and review the permission sets they expose."
          >
            <div className="grid gap-4">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles or permission keys"
                className="field-input"
              />

              {loading ? (
                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-12 text-center text-sm text-slate-500">
                  Loading roles...
                </div>
              ) : filteredRoles.length ? (
                <div className="grid gap-3">
                  {filteredRoles.map((role) => (
                    <article key={role._id} className="rounded-2xl border border-black/8 bg-white px-4 py-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-semibold text-slate-900">{role.name}</div>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${role.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                              {role.isActive !== false ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {role.description ? <div className="mt-1 text-sm text-slate-600">{role.description}</div> : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(role.permissions || []).map((permission) => (
                              <span key={permission} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => startEdit(role)} className="btn-secondary">
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(role)}
                            disabled={deletingId === role._id}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === role._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-12 text-center text-sm text-slate-500">
                  No roles matched the current search.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Admin assignments"
            description="Assign a custom role to each admin user. Leaving it blank keeps full admin access."
          >
            <div className="grid gap-3">
              {loading ? (
                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-12 text-center text-sm text-slate-500">
                  Loading admin users...
                </div>
              ) : adminUsers.length ? (
                adminUsers.map((user) => (
                  <div key={user._id} className="rounded-2xl border border-black/8 bg-white px-4 py-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-base font-semibold text-slate-900">{user.name || user.email}</div>
                        <div className="mt-1 text-sm text-slate-500">{user.email}</div>
                        <div className="mt-2 text-xs text-slate-500">
                          Current role: {user.customRole?.name || "Full admin access"}
                        </div>
                      </div>

                      <select
                        value={user.customRole?._id || ""}
                        onChange={(event) => assignRole(user._id, event.target.value)}
                        disabled={assigningUserId === user._id}
                        className="field-input min-w-[240px]"
                      >
                        <option value="">Full admin access</option>
                        {roles.filter((role) => role.isActive !== false).map((role) => (
                          <option key={role._id} value={role._id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-12 text-center text-sm text-slate-500">
                  No admin users found.
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </section>
  );
}
