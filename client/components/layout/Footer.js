"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useMenus } from "@/lib/hooks/useMenus";

const browseLinks = [
  { href: "/products", label: "All products" },
  { href: "/categories", label: "Categories" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" }
];

const supportLinks = [
  { href: "/support", label: "Help centre" },
  { href: "/account", label: "Track orders" },
  { href: "/login", label: "Customer login" },
  { href: "/vendor/dashboard", label: "Vendor dashboard" }
];

const businessLinks = [
  { href: "/vendor/dashboard", label: "Sell on MarketSphere" },
  { href: "/feed/products.xml", label: "Product feed" },
  { href: "/products?sort=newest", label: "New arrivals" },
  { href: "/products?sort=popular", label: "Popular now" }
];

function FooterIcon({ type, className = "h-5 w-5" }) {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  };

  if (type === "spark") return <svg {...commonProps}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></svg>;
  if (type === "mail") return <svg {...commonProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
  if (type === "shield") return <svg {...commonProps}><path d="M12 3l7 3v5c0 4.5-2.5 7.5-7 10-4.5-2.5-7-5.5-7-10V6l7-3Z" /><path d="m9.5 12 1.7 1.7 3.8-4" /></svg>;
  if (type === "truck") return <svg {...commonProps}><path d="M3 7h11v8H3zM14 10h3l3 3v2h-6z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></svg>;
  if (type === "refund") return <svg {...commonProps}><path d="M8 7h7l4 4v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" /><path d="M15 7v4h4" /><path d="M10 12a3.5 3.5 0 1 0 3.5 3.5" /><path d="m10 13-1.5 1.5L10 16" /></svg>;
  if (type === "support") return <svg {...commonProps}><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="12" width="4" height="7" rx="2" /><rect x="17" y="12" width="4" height="7" rx="2" /><path d="M7 19a3 3 0 0 0 3 3h4" /></svg>;
  if (type === "selection") return <svg {...commonProps}><rect x="4" y="5" width="8" height="6" rx="1.5" /><rect x="12" y="9" width="8" height="6" rx="1.5" /><path d="M8 14v5M16 4v5" /><path d="M6 19h4M14 9h4" /></svg>;
  if (type === "bag") return <svg {...commonProps}><path d="M7 8V7a5 5 0 0 1 10 0v1" /><path d="M5 8h14l-1 11H6L5 8Z" /><path d="M10 12a2 2 0 0 0 4 0" /></svg>;
  return null;
}

function resolveMenuHref(item) {
  return item?.url || item?.href || item?.link || "#";
}

function flattenMenu(items) {
  return (items || []).flatMap((item) => {
    const normalizedItem = {
      label: item?.label || "Untitled",
      href: resolveMenuHref(item)
    };
    const children = Array.isArray(item?.submenu)
      ? item.submenu.map((child) => ({
        label: child?.label || "Untitled",
        href: resolveMenuHref(child)
      }))
      : [];

    return [normalizedItem, ...children];
  }).filter((item) => item.label && item.href);
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const { browseMenu, footerMenu, policiesMenu } = useMenus();

  const browseMenuLinks = useMemo(() => {
    const nextLinks = flattenMenu(browseMenu);
    return nextLinks.length ? nextLinks.slice(0, 6) : browseLinks;
  }, [browseMenu]);

  const footerMenuLinks = useMemo(() => {
    const nextLinks = flattenMenu(footerMenu);
    return nextLinks.length ? nextLinks.slice(0, 6) : supportLinks;
  }, [footerMenu]);

  const policiesLinks = useMemo(() => {
    const nextLinks = flattenMenu(policiesMenu);
    return nextLinks.length ? nextLinks.slice(0, 6) : businessLinks;
  }, [policiesMenu]);

  const serviceCards = [
    {
      icon: "selection",
      title: "Unbeatable Selection",
      href: "/products"
    },
    {
      icon: "support",
      title: "Expert Customer Service",
      href: "/support"
    },
    {
      icon: "truck",
      title: "Fast & Free Shipping Over $35*",
      href: "/policy/shipping"
    },
    {
      icon: "bag",
      title: "Amazing Value Every Day",
      href: "/products?sort=popular"
    }
  ];

  async function handleSubscribe(event) {
    event.preventDefault();

    try {
      const response = await marketplaceApi.subscribeNewsletter({ email, source: "storefront-footer" });
      setNotice(response?.message || "Subscribed successfully");
      setEmail("");
    } catch (error) {
      setNotice(error?.message || "Unable to subscribe");
    }
  }

  return (
    <footer className="mt-5 border-t border-black/8" style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--background) 84%, var(--white)) 0%, color-mix(in srgb, var(--background) 92%, var(--secondary)) 100%)" }}>
      <div className="shell-container ">
        <section className="grid gap-4 border-b py-5 border-black/8  md:grid-cols-2 xl:grid-cols-4">
          {serviceCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="flex min-h-[110px] flex-col items-center justify-center rounded-[18px] px-5 py-6 text-center transition hover:bg-black/[0.03]"
            >
              <div className="flex h-10 w-10 items-center justify-center text-[var(--primary)]">
                <FooterIcon type={card.icon} className="h-7 w-7" />
              </div>
              <h3 className="mt-3 max-w-[17ch] text-[clamp(1.2rem,1.35vw,1.55rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--black)]">
                {card.title}
              </h3>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-[30px] border border-black/8 bg-ink px-6 py-8 text-white shadow-[0_20px_50px_rgba(16,32,26,0.18)] sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/75">
                <FooterIcon type="spark" className="h-3.5 w-3.5" />
                Modern marketplace
              </div>
              <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
                A cleaner storefront for buyers, better visibility for sellers, and a calmer path to checkout.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                MarketSphere brings products, categories, support, orders, and vendor storefronts into one polished shopping experience.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                  <FooterIcon type="truck" className="h-4 w-4" />
                </div>
                <div className="mt-4 text-sm font-semibold">Fast browsing</div>
                <div className="mt-2 text-xs leading-6 text-white/65">Search, menus, categories, and product pages built for speed.</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                  <FooterIcon type="shield" className="h-4 w-4" />
                </div>
                <div className="mt-4 text-sm font-semibold">Clear shopping flow</div>
                <div className="mt-2 text-xs leading-6 text-white/65">Product details, cart, and checkout stay simple and consistent.</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                  <FooterIcon type="mail" className="h-4 w-4" />
                </div>
                <div className="mt-4 text-sm font-semibold">Seller support</div>
                <div className="mt-2 text-xs leading-6 text-white/65">Customers can move from product to support without friction.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 rounded-[30px] border border-black/8 bg-white/80 p-6 shadow-[0_14px_36px_rgba(16,32,26,0.06)] sm:p-8 lg:grid-cols-[1.1fr_0.7fr_0.7fr_1fr]">
          <div>
            <Link href="/" className="font-display text-3xl font-bold tracking-tight text-ink">
              MarketSphere
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
              A multi-vendor marketplace with cleaner discovery, stronger product detail pages, and a more professional storefront experience.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
              <Link href="/support" className="hover:text-ink hover:underline">Support</Link>
              <Link href="/products" className="hover:text-ink hover:underline">Shop</Link>
              <Link href="/vendor/dashboard" className="hover:text-ink hover:underline">Vendor access</Link>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Browse</div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              {browseMenuLinks.map((link) => (
                <Link key={`${link.href}-${link.label}`} href={link.href} className="hover:text-ink hover:underline">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Support</div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              {footerMenuLinks.map((link) => (
                <Link key={`${link.href}-${link.label}`} href={link.href} className="hover:text-ink hover:underline">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Newsletter</div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Get updates about fresh categories, new products, and cleaner marketplace launches.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 grid gap-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                required
                className="field-input h-12 rounded-[16px] border border-black/10"
                style={{ background: "color-mix(in srgb, var(--white) 82%, var(--background))" }}
              />
              <button type="submit" className="inline-flex h-12 items-center justify-center rounded-[16px] px-5 text-sm font-semibold text-white transition" style={{ background: "var(--accent)" }}>
                Subscribe
              </button>
            </form>
            {notice ? <div className="mt-3 text-xs text-slate-500">{notice}</div> : null}
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-3 border-t border-black/8 py-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>&copy; 2026 MarketSphere. Built for modern marketplace storefronts.</div>
          <div className="flex flex-wrap gap-4">
            {policiesLinks.map((link) => (
              <Link key={`${link.href}-${link.label}`} href={link.href} className="hover:text-ink hover:underline">
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </footer>
  );
}
