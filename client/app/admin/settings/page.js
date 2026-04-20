"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const EMPTY_MENUS = {
  browseMenu: [],
  topBarMenu: [],
  mainNavMenu: [],
  footerFirstMenu: [],
  footerMenu: [],
  policiesMenu: []
};

const SETTINGS_AREAS = [
  {
    title: "Storefront Menus",
    description: "Header, browse dropdown, footer, and policy navigation.",
    href: "/admin/menus",
    cta: "Manage menus"
  },
  {
    title: "Pages & Policies SEO",
    description: "Meta titles and descriptions for designed storefront pages.",
    href: "/admin/pages-seo",
    cta: "Edit SEO"
  },
  {
    title: "URL Redirects",
    description: "Control source-to-destination path redirects across the storefront.",
    href: "/admin/redirects",
    cta: "Manage redirects"
  },
  {
    title: "Reviews Moderation",
    description: "Approval policy for customer reviews before they go live.",
    href: "/admin/reviews",
    cta: "Open reviews"
  }
];

function normalizeMenus(payload) {
  return {
    browseMenu: Array.isArray(payload?.browseMenu) ? payload.browseMenu : [],
    topBarMenu: Array.isArray(payload?.topBarMenu) ? payload.topBarMenu : [],
    mainNavMenu: Array.isArray(payload?.mainNavMenu) ? payload.mainNavMenu : [],
    footerFirstMenu: Array.isArray(payload?.footerFirstMenu) ? payload.footerFirstMenu : [],
    footerMenu: Array.isArray(payload?.footerMenu) ? payload.footerMenu : [],
    policiesMenu: Array.isArray(payload?.policiesMenu) ? payload.policiesMenu : []
  };
}

function flattenMenuLabels(items, bucket = []) {
  for (const item of items || []) {
    if (item?.label) {
      bucket.push(item.label);
    }
    if (Array.isArray(item?.submenu) && item.submenu.length) {
      flattenMenuLabels(item.submenu, bucket);
    }
  }
  return bucket;
}

function countMenuItems(items) {
  return flattenMenuLabels(items).length;
}

export default function AdminSettingsPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage store settings.");
  const [loading, setLoading] = useState(true);
  const [savingReviewSettings, setSavingReviewSettings] = useState(false);
  const [menus, setMenus] = useState(EMPTY_MENUS);
  const [requireReviewApproval, setRequireReviewApproval] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let ignore = false;

    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const [menuSettingsResponse, reviewSettingsResponse] = await Promise.all([
          marketplaceApi.getAdminMenuSettings(token),
          marketplaceApi.getAdminReviewSettings(token)
        ]);

        if (ignore) return;

        setMenus(normalizeMenus(menuSettingsResponse?.data));
        setRequireReviewApproval(reviewSettingsResponse?.data?.requireReviewApproval !== false);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      ignore = true;
    };
  }, [token, setError]);

  const metrics = useMemo(() => {
    const browseCount = countMenuItems(menus.browseMenu);
    const topBarCount = countMenuItems(menus.topBarMenu);
    const mainNavCount = countMenuItems(menus.mainNavMenu);
    const footerFirstCount = countMenuItems(menus.footerFirstMenu);
    const footerCount = countMenuItems(menus.footerMenu);
    const policiesCount = countMenuItems(menus.policiesMenu);

    return [
      { title: requireReviewApproval ? "Manual" : "Automatic", description: "Review publishing mode" },
      { title: String(browseCount + mainNavCount), description: "Primary navigation links" },
      { title: String(topBarCount + footerFirstCount + footerCount + policiesCount), description: "Supportive storefront links" }
    ];
  }, [menus, requireReviewApproval]);

  const menuSnapshots = useMemo(() => ([
    {
      key: "browse",
      title: "Browse menu",
      count: countMenuItems(menus.browseMenu),
      labels: flattenMenuLabels(menus.browseMenu).slice(0, 5)
    },
    {
      key: "topbar",
      title: "Top bar",
      count: countMenuItems(menus.topBarMenu),
      labels: flattenMenuLabels(menus.topBarMenu).slice(0, 5)
    },
    {
      key: "mainnav",
      title: "Main navigation",
      count: countMenuItems(menus.mainNavMenu),
      labels: flattenMenuLabels(menus.mainNavMenu).slice(0, 5)
    },
    {
      key: "footerfirst",
      title: "Footer first menu",
      count: countMenuItems(menus.footerFirstMenu),
      labels: flattenMenuLabels(menus.footerFirstMenu).slice(0, 5)
    },
    {
      key: "footer",
      title: "Footer",
      count: countMenuItems(menus.footerMenu),
      labels: flattenMenuLabels(menus.footerMenu).slice(0, 5)
    },
    {
      key: "policies",
      title: "Policies",
      count: countMenuItems(menus.policiesMenu),
      labels: flattenMenuLabels(menus.policiesMenu).slice(0, 5)
    }
  ]), [menus]);

  async function handleReviewSettingToggle() {
    if (!token) return;

    try {
      setSavingReviewSettings(true);
      setError("");

      const response = await marketplaceApi.updateAdminReviewSettings(token, {
        requireReviewApproval: !requireReviewApproval
      });

      const nextValue = response?.data?.requireReviewApproval !== false;
      setRequireReviewApproval(nextValue);
      toast.success(nextValue ? "Review approval enabled" : "Reviews now publish automatically");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Unable to update review settings");
    } finally {
      setSavingReviewSettings(false);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-[30px] border border-black/5 bg-white/82 p-8 shadow-soft backdrop-blur-md">
        <div className="eyebrow">Admin</div>
        <h1 className="mt-3 font-display text-4xl font-bold text-ink">Store settings</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Control global storefront behavior from one place. This page surfaces live settings already connected to menus and review moderation.
        </p>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <SectionCard key={metric.description} title={metric.title} description={metric.description} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Storefront Controls"
          description="Update operational settings that immediately affect the public storefront."
        >
          <div className="grid gap-5">
            <div className="rounded-[24px] border border-black/6 bg-white/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="text-sm font-semibold text-ink">Customer review approval</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {requireReviewApproval
                      ? "Every new review stays pending until an admin approves it."
                      : "New reviews become visible immediately without moderation."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReviewSettingToggle}
                  disabled={savingReviewSettings || loading}
                  className={`rounded-full px-5 py-3 text-sm font-semibold text-white transition ${savingReviewSettings || loading
                    ? "cursor-not-allowed bg-slate-400"
                    : requireReviewApproval
                      ? "bg-[#0f766e] hover:bg-[#0c5c56]"
                      : "bg-slate-900 hover:bg-slate-700"
                    }`}
                >
                  {savingReviewSettings
                    ? "Saving..."
                    : requireReviewApproval
                      ? "Approval Required"
                      : "Auto Publish Enabled"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {SETTINGS_AREAS.map((area) => (
                <div key={area.href} className="rounded-[24px] border border-black/6 bg-white/70 p-5">
                  <div className="text-base font-semibold text-ink">{area.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{area.description}</p>
                  <Link
                    href={area.href}
                    className="mt-4 inline-flex rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
                  >
                    {area.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Configuration Summary"
          description="Quick view of the live storefront settings document."
        >
          <div className="grid gap-4">
            <div className="rounded-[24px] border border-[#dbe7df] bg-[linear-gradient(135deg,#f6faf7_0%,#eef5f1_100%)] p-5">
              <div className="text-sm font-semibold text-ink">Current publishing mode</div>
              <div className="mt-3 text-2xl font-bold text-ink">
                {requireReviewApproval ? "Moderated reviews" : "Instant reviews"}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {requireReviewApproval
                  ? "Admins review customer feedback before it appears publicly."
                  : "Customer reviews publish without waiting for moderation."}
              </p>
            </div>

            <div className="rounded-[24px] border border-black/6 bg-white/70 p-5">
              <div className="text-sm font-semibold text-ink">Settings coverage</div>
              <ul className="mt-3 grid gap-2 text-sm text-slate-600">
                <li>Menus are loaded from the shared storefront menu settings document.</li>
                <li>Review moderation is controlled by the live admin review settings endpoint.</li>
                <li>SEO pages and redirects are managed from their dedicated admin tools.</li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Navigation Snapshot"
        description="Preview the current storefront navigation structure before opening the full menu builder."
      >
        {loading ? (
          <div className="rounded-[24px] border border-dashed border-black/10 px-4 py-12 text-center text-sm text-slate-500">
            Loading store settings...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {menuSnapshots.map((menu) => (
              <div key={menu.key} className="rounded-[24px] border border-black/6 bg-white/70 p-5">
                <div className="text-sm font-semibold text-ink">{menu.title}</div>
                <div className="mt-3 text-3xl font-bold text-ink">{menu.count}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Saved links</div>

                <div className="mt-4 grid gap-2">
                  {menu.labels.length ? (
                    menu.labels.map((label) => (
                      <div key={label} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                        {label}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">No links configured yet.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </section>
  );
}
