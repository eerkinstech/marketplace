"use client";

import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { InventoryManager } from "@/components/dashboard/InventoryManager";

export default function AdminInventoryPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage marketplace inventory.");
  const [rows, setRows] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState("all");

  async function load() {
    if (!token) return;
    try {
      const inventoryRes = await marketplaceApi.getAdminInventory(token);
      setRows(inventoryRes.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const ownerTabs = useMemo(() => ([
    { id: "all", label: "All", count: rows.length },
    { id: "vendor", label: "Vendor", count: rows.filter((row) => row.ownerType === "vendor").length },
    { id: "admin", label: "Admin", count: rows.filter((row) => row.ownerType === "admin").length }
  ]), [rows]);

  const visibleRows = useMemo(() => {
    if (ownerFilter === "all") return rows;
    return rows.filter((row) => row.ownerType === ownerFilter);
  }, [ownerFilter, rows]);

  async function saveRow(id, payload) {
    try {
      await marketplaceApi.updateAdminProduct(token, id, payload);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <InventoryManager
      eyebrow="Admin"
      title="Inventory Management"
      description="Manage admin and vendor product stock, base inventory, and variant pricing from one searchable marketplace view."
      products={visibleRows}
      error={error}
      onSaveProduct={saveRow}
      editHrefPrefix="/admin/products/new"
      ownerTabs={ownerTabs}
      activeOwnerFilter={ownerFilter}
      onOwnerFilterChange={setOwnerFilter}
    />
  );
}
