"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { tokenStore } from "@/lib/auth/token-store";

const menuGroups = [
  {
    groupId: "main",
    groupLabel: "Main",
    collapsible: true,
    items: [
      { label: "Dashboard", path: "/vendor/dashboard", icon: "grid" },
      { label: "Store Overview", path: "/vendor/store-overview", icon: "storefront" }
    ]
  },
  {
    groupId: "catalog",
    groupLabel: "Catalog",
    collapsible: true,
    items: [
      { label: "Products", path: "/vendor/products", icon: "box" },
      { label: "Add Product", path: "/vendor/products/new", icon: "plus" },
      { label: "Inventory", path: "/vendor/inventory", icon: "layers" },
      { label: "Media", path: "/vendor/media", icon: "image" }
    ]
  },
  {
    groupId: "sales",
    groupLabel: "Sales & Fulfillment",
    collapsible: true,
    items: [
      { label: "Orders", path: "/vendor/orders", icon: "cart" },
      { label: "Coupons", path: "/vendor/coupons", icon: "tag" },
      { label: "Returns", path: "/vendor/returns", icon: "rotate" },
      { label: "Shipping", path: "/vendor/shipping", icon: "truck" },
      { label: "Earnings", path: "/vendor/earnings", icon: "wallet" }
    ]
  },
  {
    groupId: "customers",
    groupLabel: "Customers & Trust",
    collapsible: true,
    items: [
      { label: "Announcements", path: "/vendor/announcements", icon: "bell" },
      { label: "Customers", path: "/vendor/customers", icon: "users" },
      { label: "Reviews", path: "/vendor/reviews", icon: "star" },
      { label: "Chat", path: "/vendor/chat", icon: "chat" }
    ]
  },
  {
    groupId: "insights",
    groupLabel: "Insights",
    collapsible: true,
    items: [
      { label: "Analytics", path: "/vendor/analytics", icon: "chart" },
      { label: "Settings", path: "/vendor/settings", icon: "settings" }
    ]
  }
];

function Icon({ name, className = "h-4 w-4" }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    className,
    "aria-hidden": true
  };

  const icons = {
    grid: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 3h6" />,
    box: <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5 12 4l8 3.5M4 7.5V16L12 20m-8-12.5L12 11m8-3.5V16L12 20m0-9v9" />,
    plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />,
    layers: <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 9 4.5-9 4.5-9-4.5L12 3Zm-9 9 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />,
    image: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm3 9 3-3 3 3 4-5 3 4" />,
    cart: <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h2l2.2 9.2a1 1 0 0 0 1 .8h7.9a1 1 0 0 0 1-.8L20 8H7m3 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />,
    rotate: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M7 17a7 7 0 0 0 11.4-2M17 7A7 7 0 0 0 5.6 9" />,
    truck: <path strokeLinecap="round" strokeLinejoin="round" d="M10 17h4m-9 0h2m10 0h2m-9 0V7h8l3 4v6M5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />,
    wallet: <path strokeLinecap="round" strokeLinejoin="round" d="M4 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v2H4zm0 2h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm11 4h3" />,
    storefront: <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16M5 10V7l2-3h10l2 3v3M6 10v10h12V10M9 20v-6h6v6" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm7 4a4 4 0 0 0-3-3.87" />,
    star: <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1L12 17.2 6.4 20l1.1-6.1L3 9.6l6.2-.9Z" />,
    chat: <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m7-8H4a2 2 0 0 0-2 2v11l4-3h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" />,
    bell: <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H5l1.4-1.4A2 2 0 0 0 7 14.2V11a5 5 0 1 1 10 0v3.2a2 2 0 0 0 .6 1.4L19 17h-4m0 0a3 3 0 1 1-6 0h6Z" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" d="M5 19V9m7 10V5m7 14v-7" />,
    settings: <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 4.3a1 1 0 0 1 1.4-.7l.8.3a1 1 0 0 0 1 0l.8-.3a1 1 0 0 1 1.4.7l.3.8a1 1 0 0 0 .7.6l.9.2a1 1 0 0 1 .7 1.4l-.3.8a1 1 0 0 0 0 1l.3.8a1 1 0 0 1-.7 1.4l-.9.2a1 1 0 0 0-.7.6l-.3.8a1 1 0 0 1-1.4.7l-.8-.3a1 1 0 0 0-1 0l-.8.3a1 1 0 0 1-1.4-.7l-.3-.8a1 1 0 0 0-.7-.6l-.9-.2a1 1 0 0 1-.7-1.4l.3-.8a1 1 0 0 0 0-1l-.3-.8a1 1 0 0 1 .7-1.4l.9-.2a1 1 0 0 0 .7-.6zM12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" />,
    tag: <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .94.713 1.752 1.693 1.923L12 15l6.307-2.508c.98-.171 1.693-.982 1.693-1.923V5.25A2.25 2.25 0 0 0 18.75 3H14.432a2.25 2.25 0 0 0-2.25 2.25V6h-2.814V5.25A2.25 2.25 0 0 0 6.568 3" />,
    chevronDown: <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />,
    chevronRight: <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />,
    logout: <path strokeLinecap="round" strokeLinejoin="round" d="M15 16l4-4-4-4M19 12H9m4 8H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7" />
  };

  return <svg {...props}>{icons[name]}</svg>;
}

export function VendorSidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState(null);
  const [expanded, setExpanded] = useState({
    catalog: false,
    sales: false,
    customers: false,
    insights: false
  });

  const stats = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return {
      section: parts[1] ? parts[1].replace(/-/g, " ") : "dashboard"
    };
  }, [pathname]);

  useEffect(() => {
    async function loadProfile() {
      const token = tokenStore.get();
      if (!token) return;

      try {
        const response = await marketplaceApi.getVendorProfile(token);
        setProfile(response.data || null);
      } catch {
        setProfile(null);
      }
    }

    loadProfile();
  }, []);

  const storeName = profile?.storeName || "Vendor Studio";
  const storeLogo = profile?.storeLogo || "";
  const initials = (storeName || "VS")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 flex-col border-r border-[#d7dfdb] bg-black shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:flex">
      <div className="border-b border-[#d7dfdb] px-5 py-5">
        <Link href="/vendor/dashboard" className="block rounded-[26px] border border-[#d7dfdb] bg-[linear-gradient(135deg,#123b36_0%,#1d5c54_100%)] p-4 text-white shadow-[0_20px_45px_rgba(18,59,54,0.28)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/12 text-sm font-bold tracking-[0.18em]">
              {storeLogo ? <img src={storeLogo} alt={`${storeName} logo`} className="h-full w-full object-cover" /> : initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-bold tracking-[-0.03em]">{storeName}</div>
             
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {menuGroups.map((group) => (
            <section key={group.groupId} className="rounded-[24px] border border-[#dce5e0]   p-2 shadow-[0_12px_25px_rgba(15,23,42,0.04)]">
              {group.collapsible ? (
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [group.groupId]: !prev[group.groupId] }))}
                  className="flex w-full items-center justify-between rounded-[18px] px-3 py-2 text-left"
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">{group.groupLabel}</span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f5f3] text-slate-500">
                    <Icon name={expanded[group.groupId] ? "chevronDown" : "chevronRight"} className="h-4 w-4" />
                  </span>
                </button>
              ) : (
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{group.groupLabel}</div>
              )}

              {(group.collapsible ? expanded[group.groupId] : true) ? (
                <div className="space-y-1.5 px-1 pb-1">
                  {group.items.map((item) => {
                    const active = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-3 rounded-[18px] px-3 py-3 text-[13px] font-semibold transition ${
                          active
                            ? "bg-[linear-gradient(135deg,#18453f_0%,#25655b_100%)] text-white shadow-[0_14px_28px_rgba(37,101,91,0.2)]"
                            : "text-white hover:bg-[#f3f7f5] hover:text-slate-950"
                        }`}
                      >
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[14px] ${
                          active ? "bg-white/12 text-white" : "bg-[#edf4f1] text-[#285f57]"
                        }`}>
                          <Icon name={item.icon} />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </nav>

      <div className="border-t border-[#d7dfdb] p-4">
        <div className="rounded-[24px] cursor-pointer p-3 shadow-[0_12px_25px_rgba(15,23,42,0.04)]">
          <button
            type="button"
            onClick={() => {
              tokenStore.clear();
              window.location.href = "/login";
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#dc2626] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b91c1c]"
          >
            <Icon name="logout" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
