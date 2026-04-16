"use client";

import { useEffect, useState } from "react";
import MediaLibrary from "@/components/media/MediaLibrary";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

export default function VendorMediaPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to manage media.");
  const [media, setMedia] = useState([]);

  const load = async () => {
    if (!token) return;
    try {
      const [mediaResponse, profileResponse] = await Promise.all([
        marketplaceApi.getVendorMedia(token),
        marketplaceApi.getVendorProfile(token)
      ]);

      const ownerId = String(profileResponse.data?._id || "");
      setMedia(
        (mediaResponse.data || []).filter((item) => String(item.owner?._id || item.owner || "") === ownerId)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  return (
    <MediaLibrary
      eyebrow="Vendor"
      title="Media library"
      error={error}
      items={media}
      onUpload={async (images) => {
        await marketplaceApi.createVendorMedia(token, { images });
        await load();
      }}
      onDelete={async (id) => {
        await marketplaceApi.deleteVendorMedia(token, id);
        await load();
      }}
      onBulkDelete={async (ids) => {
        await marketplaceApi.bulkDeleteVendorMedia(token, { ids });
        await load();
      }}
    />
  );
}
