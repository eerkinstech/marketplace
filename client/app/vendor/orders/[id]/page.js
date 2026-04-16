"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { OrderDetailView } from "@/components/orders/OrderDetailView";

export default function VendorOrderDetailPage() {
  const params = useParams();
  const { token, error, setError } = useAccessToken("Login with a vendor account to view order details.");
  const [order, setOrder] = useState(null);
  const orderId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    async function load() {
      if (!token || !orderId) return;

      try {
        const response = await marketplaceApi.getVendorOrder(token, orderId);
        setOrder(response.data);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, [orderId, setError, token]);

  if (error) {
    return <section className="container page-section"><div className="card section small">{error}</div></section>;
  }

  if (!order) {
    return <section className="container page-section"><div className="card section small">Loading order details...</div></section>;
  }

  return (
    <OrderDetailView
      order={order}
      eyebrow="Vendor"
      title="Order detail"
      backHref="/vendor/orders"
      backLabel="Back to order management"
    />
  );
}
