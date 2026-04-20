"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";

const menusCache = {
  data: null,
  promise: null,
  loaded: false
};

const emptyMenus = {
  browseMenu: [],
  mainNavMenu: [],
  footerFirstMenu: [],
  footerMenu: [],
  policiesMenu: [],
  topBarMenu: []
};

function normalizeMenus(payload) {
  return {
    browseMenu: Array.isArray(payload?.browseMenu) ? payload.browseMenu : [],
    mainNavMenu: Array.isArray(payload?.mainNavMenu) ? payload.mainNavMenu : [],
    footerFirstMenu: Array.isArray(payload?.footerFirstMenu) ? payload.footerFirstMenu : [],
    footerMenu: Array.isArray(payload?.footerMenu) ? payload.footerMenu : [],
    policiesMenu: Array.isArray(payload?.policiesMenu) ? payload.policiesMenu : [],
    topBarMenu: Array.isArray(payload?.topBarMenu) ? payload.topBarMenu : []
  };
}

export function useMenus() {
  const [menus, setMenus] = useState(emptyMenus);
  const [loading, setLoading] = useState(!menusCache.loaded);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadMenus() {
      try {
        if (menusCache.loaded && menusCache.data) {
          if (mounted) {
            setMenus(menusCache.data);
            setLoading(false);
          }
          return;
        }

        if (!menusCache.promise) {
          menusCache.promise = marketplaceApi.getPublicMenuSettings().then((response) => {
            const nextMenus = normalizeMenus(response?.data);
            menusCache.data = nextMenus;
            menusCache.loaded = true;
            return nextMenus;
          });
        }

        const nextMenus = await menusCache.promise;
        if (mounted) {
          setMenus(nextMenus);
          setLoading(false);
        }
      } catch (nextError) {
        menusCache.promise = null;
        if (mounted) {
          setError(nextError?.message || "Failed to load menus");
          setLoading(false);
        }
      }
    }

    loadMenus();

    return () => {
      mounted = false;
    };
  }, []);

  return { ...menus, loading, error };
}
