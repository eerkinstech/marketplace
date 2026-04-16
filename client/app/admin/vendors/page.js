"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { DataTable } from "@/components/dashboard/DataTable";

export default function AdminVendorsPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage vendors.");
  const [vendors, setVendors] = useState([]);

  async function load() {
    if (!token) return;
    try {
      const response = await marketplaceApi.getAdminVendors(token);
      setVendors(response.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function setStatus(id, status) {
    try {
      await marketplaceApi.updateVendorStatus(token, id, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="container page-section stack">
      <div><div className="eyebrow">Admin</div><h1 className="page-title">Vendor management</h1></div>
      {error ? <div className="card section small">{error}</div> : null}
      <DataTable rows={vendors} columns={[
        { key: "storeName", label: "Store" },
        { key: "email", label: "Email" },
        { key: "status", label: "Status", render: (row) => <span className="badge">{row.status}</span> },
        { key: "actions", label: "Actions", render: (row) => <div className="flex gap-2"><button className="btn-secondary" type="button" onClick={() => setStatus(row._id, "active")}>Approve</button><button className="btn-secondary" type="button" onClick={() => setStatus(row._id, "suspended")}>Suspend</button></div> }
      ]} />
    </section>
  );
}
