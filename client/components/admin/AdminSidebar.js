"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { adminMenuGroups, defaultAdminExpandedState, getFirstAccessibleAdminPath, hasAdminPermission } from "@/lib/auth/admin-access";
import { tokenStore } from "@/lib/auth/token-store";
import toast from "react-hot-toast";

function Icon({ name, className = "h-4 w-4" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true
  };

  const icons = {
    home: <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5.25 9.75V21h13.5V9.75" />,
    package: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7l8 4 8-4-8-4Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10l8 4 8-4V7" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 11v10" /></>,
    "plus-circle": <><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 8v8M8 12h8" /></>,
    boxes: <><path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5 9 5l5 2.5L9 10 4 7.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 13.5 15 11l5 2.5-5 2.5-5-2.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 14.5 9 12l5 2.5L9 17l-5-2.5Z" /></>,
    tags: <><path strokeLinecap="round" strokeLinejoin="round" d="M20 10 12 18l-8-8V4h6l10 10Z" /><circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" /></>,
    "layer-group": <><path strokeLinecap="round" strokeLinejoin="round" d="m12 4 8 4-8 4-8-4 8-4Z" /><path strokeLinecap="round" strokeLinejoin="round" d="m4 12 8 4 8-4" /><path strokeLinecap="round" strokeLinejoin="round" d="m4 16 8 4 8-4" /></>,
    image: <><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" /><path strokeLinecap="round" strokeLinejoin="round" d="m20 16-4.5-4.5L8 19" /></>,
    list: <><path strokeLinecap="round" d="M9 7h9M9 12h9M9 17h9" /><circle cx="5" cy="7" r="1" fill="currentColor" stroke="none" /><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="5" cy="17" r="1" fill="currentColor" stroke="none" /></>,
    images: <><rect x="3" y="6" width="12" height="12" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="m6 15 2.5-2.5L11 15l2-2 2 2" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7" /></>,
    plus: <path strokeLinecap="round" d="M12 5v14M5 12h14" />,
    "clipboard-list": <><rect x="6" y="4" width="12" height="16" rx="2" /><path strokeLinecap="round" d="M9 4.5h6M9 10h6M9 14h6M9 18h4" /></>,
    "exchange-alt": <><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h11m0 0-3-3m3 3-3 3" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 17H6m0 0 3 3m-3-3 3-3" /></>,
    users: <><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.5" /><path strokeLinecap="round" d="M4.5 18a4.5 4.5 0 0 1 9 0M14 18a3.5 3.5 0 0 1 6 0" /></>,
    "ticket-alt": <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a2 2 0 0 0 0 6v3h16v-3a2 2 0 0 1 0-6V6H4v3Z" />,
    store: <><path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 10V7l2-3h10l2 3v3" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 10v10h12V10" /></>,
    truck: <><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3zM14 10h3l3 3v2h-6z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></>,
    wallet: <><path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" /><path strokeLinecap="round" d="M15 12h5" /><circle cx="15.5" cy="12" r=".75" fill="currentColor" stroke="none" /></>,
    star: <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.7 5.47L21 9.39l-4.5 4.39 1.06 6.22L12 17.1 6.44 20l1.06-6.22L3 9.39l6.3-.92L12 3Z" />,
    comments: <><path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" /></>,
    envelope: <><rect x="3" y="6" width="18" height="12" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="m4 8 8 6 8-6" /></>,
    "chart-line": <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M6 15l4-4 3 3 5-6" />,
    link: <><path strokeLinecap="round" strokeLinejoin="round" d="M10 14 8 16a3 3 0 1 1-4-4l3-3a3 3 0 0 1 4 0" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 10 16 8a3 3 0 1 1 4 4l-3 3a3 3 0 0 1-4 0" /><path strokeLinecap="round" d="m9 15 6-6" /></>,
    "file-alt": <><path strokeLinecap="round" strokeLinejoin="round" d="M8 3h6l4 4v14H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" /><path strokeLinecap="round" d="M10 12h6M10 16h6" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path strokeLinecap="round" d="M8 11V8a4 4 0 1 1 8 0v3" /></>,
    cog: <><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" /></>,
    chevronDown: <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />,
    chevronRight: <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />,
    logout: <><path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5" /><path strokeLinecap="round" d="M21 12H9" /></>
  };

  return <svg {...common}>{icons[name] || <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />}</svg>;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(defaultAdminExpandedState);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const token = tokenStore.get();
      if (!token) {
        if (active) setUser(null);
        return;
      }

      try {
        const response = await marketplaceApi.getAuthProfile(token);
        if (active) setUser(response?.data || null);
      } catch {
        if (active) setUser({ role: "admin" });
      }
    }

    loadProfile();

    const syncAuth = () => loadProfile();
    window.addEventListener("auth:updated", syncAuth);
    return () => {
      active = false;
      window.removeEventListener("auth:updated", syncAuth);
    };
  }, []);

  const hasPermission = (permissionId) => hasAdminPermission(user, permissionId);
  const homePath = getFirstAccessibleAdminPath(user || { role: "admin" });

  const handleLogout = () => {
    tokenStore.clear();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const getActiveItem = () => {
    for (const group of adminMenuGroups) {
      for (const item of group.items) {
        if (pathname === item.path || pathname.startsWith(item.path)) {
          return item.path;
        }
      }
    }
    return null;
  };

  const activePath = getActiveItem();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-30 hidden w-72 overflow-hidden border-r border-amber-200/10 text-slate-100 shadow-[0_24px_60px_rgba(2,6,23,0.45)] lg:block"
      style={{ height: "100vh" }}
    >
      <div className="flex h-full min-h-full flex-col bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.12),_transparent_22%),linear-gradient(180deg,_#08111f_0%,_#0d1b2a_45%,_#132238_100%)]">
      <div className="shrink-0 border-b border-white/10 px-5 py-6">
        <Link href={homePath} className="group flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-[linear-gradient(135deg,_#f59e0b,_#d97706)] text-base font-black tracking-[0.18em] text-slate-950 shadow-[0_10px_30px_rgba(245,158,11,0.25)] transition-transform duration-200 group-hover:-translate-y-0.5">
            MP
          </div>
          <div>
            <div className="text-lg font-semibold tracking-wide text-white">Admin Panel</div>
            <div className="text-xs uppercase tracking-[0.24em] text-amber-200/70">Control Center</div>
          </div>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-3">
          {adminMenuGroups.map((group) => {
            const accessibleItems = group.items.filter((item) => hasPermission(item.permissionId || item.path));
            if (accessibleItems.length === 0) return null;

            const isExpanded = group.collapsible ? expanded[group.groupId] : true;

            return (
              <section key={group.groupId} className="rounded-2xl border border-white/6 bg-white/[0.03]  backdrop-blur-sm">
                {group.collapsible ? (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [group.groupId]: !prev[group.groupId]
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-xl px-4 py-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-white/[0.04] hover:text-amber-200"
                  >
                    <span>{group.groupLabel}</span>
                    <Icon name={isExpanded ? "chevronDown" : "chevronRight"} className="h-3.5 w-3.5 text-amber-300/80" />
                  </button>
                ) : (
                  <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                    {group.groupLabel}
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-2 space-y-1.5">
                    {accessibleItems.map((item) => {
                      const isActive = activePath === item.path;
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${isActive
                            ? "border border-amber-300/20 bg-[linear-gradient(135deg,_rgba(245,158,11,0.22),_rgba(13,148,136,0.2))] text-white shadow-[0_10px_24px_rgba(13,148,136,0.18)]"
                            : "border border-transparent text-white hover:border-white/8 hover:bg-white/[0.05] hover:text-white"
                            }`}
                        >
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${isActive
                              ? "bg-slate-950/30 text-amber-200"
                              : "bg-slate-800/70 text-white group-hover:bg-slate-800 group-hover:text-amber-200"
                              }`}
                          >
                            <Icon name={item.icon} className="h-4 w-4" />
                          </span>
                          <span className="flex-1">{item.label}</span>
                          {isActive ? <span className="h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.9)]"></span> : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto shrink-0 border-t border-white/10 bg-slate-950/25 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition-all duration-200 hover:border-red-300/30 hover:bg-red-500/20 hover:text-white"
        >
          <Icon name="logout" className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
      </div>
    </aside>
  );
}
