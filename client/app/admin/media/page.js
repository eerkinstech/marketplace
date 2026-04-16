"use client";

import { useEffect, useState } from "react";
import MediaLibrary from "@/components/media/MediaLibrary";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

export default function AdminMediaPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage media.");
  const [rows, setRows] = useState([]);

  const load = async () => {
    if (!token) return;
    try {
      const response = await marketplaceApi.getAdminMedia(token);
      setRows(response.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  return (
    <MediaLibrary
      eyebrow="Admin"
      title="Media library"
      error={error}
      items={rows}
      showOwnerLabel
      onUpload={async (images) => {
        await marketplaceApi.createAdminMedia(token, { images });
        await load();
      }}
      onDelete={async (id) => {
        await marketplaceApi.deleteAdminMedia(token, id);
        await load();
      }}
      onBulkDelete={async (ids) => {
        await marketplaceApi.bulkDeleteAdminMedia(token, { ids });
        await load();
      }}
    />
  );
}
