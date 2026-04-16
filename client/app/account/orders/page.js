"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { tokenStore } from "@/lib/auth/token-store";
import { AccountQuickLinks } from "@/components/account/AccountQuickLinks";
import { DataTable } from "@/components/dashboard/DataTable";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const token = tokenStore.get();
        if (!token) return setError("Login first to view customer orders.");
        const response = await marketplaceApi.getCustomerOrders(token);
        setOrders(response.data);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  return (
    <section className="container page-section stack">
      <div>
        <div className="kicker">Customer account</div>
        <h1 className="page-title">Your orders</h1>
      </div>
      <AccountQuickLinks />
      {error ? <div className="card section small">{error}</div> : null}
      <DataTable
        columns={[
          { key: "_id", label: "Order" },
          { key: "status", label: "Status", render: (row) => <span className="badge">{row.status}</span> },
          { key: "paymentStatus", label: "Payment" },
          { key: "totalAmount", label: "Total", render: (row) => `$${row.totalAmount}` },
          { key: "createdAt", label: "Placed", render: (row) => new Date(row.createdAt).toLocaleDateString() },
          { key: "actions", label: "Actions", render: (row) => <Link href={`/account/orders/${row._id}`} className="btn-secondary !px-4 !py-2">View details</Link> }
        ]}
        rows={orders}
      />
    </section>
  );
}
