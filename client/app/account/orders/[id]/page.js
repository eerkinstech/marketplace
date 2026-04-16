"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace";
import { tokenStore } from "@/lib/auth/token-store";
import { OrderDetailView } from "@/components/orders/OrderDetailView";

export default function AccountOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const orderId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    async function load() {
      try {
        const token = tokenStore.get();
        if (!token) {
          setError("Login first to view order details.");
          return;
        }

        if (!orderId) return;

        const response = await marketplaceApi.getCustomerOrder(token, orderId);
        setOrder(response.data);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, [orderId]);

  if (error) {
    return <section className="container page-section"><div className="card section small">{error}</div></section>;
  }

  if (!order) {
    return <section className="container page-section"><div className="card section small">Loading order details...</div></section>;
  }

  return (
    <OrderDetailView
      order={order}
      eyebrow="Customer account"
      title="Order details"
      backHref="/account/orders"
      backLabel="Back to your orders"
    />
  );
}
