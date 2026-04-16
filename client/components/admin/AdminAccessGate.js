"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace";
import { canAccessAdminPath, getFirstAccessibleAdminPath } from "@/lib/auth/admin-access";
import { tokenStore } from "@/lib/auth/token-store";

export function AdminAccessGate({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function validateAccess() {
      const token = tokenStore.get();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await marketplaceApi.getAuthProfile(token);
        const user = response?.data || null;

        if (!user || user.role !== "admin") {
          tokenStore.clear();
          router.replace("/login");
          return;
        }

        if (!canAccessAdminPath(user, pathname)) {
          router.replace(getFirstAccessibleAdminPath(user));
          return;
        }

        if (active) {
          setAllowed(true);
          setChecking(false);
        }
      } catch {
        tokenStore.clear();
        router.replace("/login");
      }
    }

    if (active) {
      setAllowed(false);
      setChecking(true);
    }

    validateAccess();

    const syncAuth = () => validateAccess();
    window.addEventListener("auth:updated", syncAuth);

    return () => {
      active = false;
      window.removeEventListener("auth:updated", syncAuth);
    };
  }, [pathname, router]);

  if (checking || !allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Checking access...
        </div>
      </div>
    );
  }

  return children;
}
