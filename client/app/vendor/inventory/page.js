"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { InventoryManager } from "@/components/dashboard/InventoryManager";

export default function VendorInventoryPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to manage inventory.");
  const [items, setItems] = useState([]);

  async function load() {
    if (!token) return;
    try {
      const response = await marketplaceApi.getVendorInventory(token);
      setItems(response.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [token, setError]);

  async function saveRow(id, payload) {
    try {
      await marketplaceApi.updateVendorProduct(token, id, payload);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <InventoryManager
      eyebrow="Vendor"
      title="Inventory Management"
      description="Review your catalog, update stock, and manage variant pricing from a single inventory workspace."
      products={items}
      error={error}
      onSaveProduct={saveRow}
      editHrefPrefix="/vendor/products/new"
    />
  );
}
