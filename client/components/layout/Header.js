"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useMenus } from "@/lib/hooks/useMenus";
import { tokenStore } from "@/lib/auth/token-store";
import { cartStore } from "@/lib/utils/cart-store";
import { wishlistStore } from "@/lib/utils/wishlist-store";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/support", label: "Support" }
];

const topBarFallbackLinks = [
  { href: "/support", label: "Help Centre" },
  { href: "/account", label: "Track Orders" },
  { href: "/vendor/dashboard", label: "Sell on MarketSphere" }
];

const featuredCategoryLinks = [
  { href: "/products?sort=popular", label: "Popular now" },
  { href: "/products?sort=newest", label: "New arrivals" },
  { href: "/products?sort=price_asc", label: "Best value" },
  { href: "/store/demo", label: "Featured stores" }
];

function resolveMenuHref(item) {
  return item?.url || item?.href || item?.link || "#";
}

function normalizeMenuItems(items, fallback = []) {
  if (!Array.isArray(items) || !items.length) return fallback;

  return items
    .map((item) => ({
      ...item,
      href: resolveMenuHref(item),
      label: item?.label || "Untitled",
      submenu: Array.isArray(item?.submenu) ? item.submenu : []
    }))
    .filter((item) => item.label && item.href);
}

function isLinkActive(pathname, href) {
  if (!href || href === "#") return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function HeaderIcon({ type, className = "h-4 w-4" }) {
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

  if (type === "menu") return <svg {...commonProps}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  if (type === "close") return <svg {...commonProps}><path d="M6 6l12 12M18 6L6 18" /></svg>;
  if (type === "search") return <svg {...commonProps}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>;
  if (type === "mic") return <svg {...commonProps}><path d="M12 4a3 3 0 0 1 3 3v4a3 3 0 1 1-6 0V7a3 3 0 0 1 3-3Z" /><path d="M19 11a7 7 0 0 1-14 0M12 18v3M9 21h6" /></svg>;
  if (type === "cart") return <svg {...commonProps}><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /><path d="M3 5h2l2.2 9h9.8l2-7H7.6" /></svg>;
  if (type === "user") return <svg {...commonProps}><circle cx="12" cy="8" r="3.5" /><path d="M5 19a7 7 0 0 1 14 0" /></svg>;
  if (type === "heart") return <svg {...commonProps}><path d="M12 20s-7-4.6-7-10.2A4.3 4.3 0 0 1 9.3 5c1.2 0 2.2.5 2.7 1.5.5-1 1.5-1.5 2.7-1.5A4.3 4.3 0 0 1 19 9.8C19 15.4 12 20 12 20Z" /></svg>;
  if (type === "grid") return <svg {...commonProps}><rect x="4" y="4" width="6" height="6" rx="1.2" /><rect x="14" y="4" width="6" height="6" rx="1.2" /><rect x="4" y="14" width="6" height="6" rx="1.2" /><rect x="14" y="14" width="6" height="6" rx="1.2" /></svg>;
  if (type === "chevron-down") return <svg {...commonProps}><path d="m6 9 6 6 6-6" /></svg>;
  if (type === "chevron-up") return <svg {...commonProps}><path d="m18 15-6-6-6 6" /></svg>;
  return null;
}

function BrowseTree({ items, mobile = false, onNavigate = null }) {
  if (!items.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.id || `${item.label}-${item.href}`}
          className={`rounded-[18px] border border-black/6 bg-[#fcfaf7] ${mobile ? "p-4" : "p-4"}`}
        >
          <Link href={item.href} onClick={onNavigate} className="text-sm font-semibold text-ink transition hover:text-[#c07a34]">
            {item.label}
          </Link>
          {item.submenu?.length ? (
            <div className="mt-3 grid gap-2 border-t border-black/6 pt-3 sm:grid-cols-2">
              {item.submenu.map((child) => (
                <Link
                  key={child.id || `${child.label}-${child.url}`}
                  href={resolveMenuHref(child)}
                  onClick={onNavigate}
                  className="text-sm text-slate-600 transition hover:text-ink"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [categories, setCategories] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartBadgePulse, setCartBadgePulse] = useState(false);
  const [wishlistBadgePulse, setWishlistBadgePulse] = useState(false);
  const [flyingBubble, setFlyingBubble] = useState(null);
  const [bubbleActive, setBubbleActive] = useState(false);
  const cartButtonRef = useRef(null);
  const wishlistButtonRef = useRef(null);

  const { browseMenu, mainNavMenu, topBarMenu } = useMenus();
  const topBarLinks = useMemo(() => normalizeMenuItems(topBarMenu, topBarFallbackLinks), [topBarMenu]);
  const navLinks = useMemo(() => normalizeMenuItems(mainNavMenu, primaryLinks), [mainNavMenu]);
  const browseLinks = useMemo(() => normalizeMenuItems(browseMenu), [browseMenu]);

  function getCartCount() {
    return cartStore.getItems().reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
  }

  function getWishlistCount() {
    return wishlistStore.getItems().length;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("search") || "");
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cartPulseTimeout;
    let wishlistPulseTimeout;
    let bubbleStartTimeout;
    let bubbleEndTimeout;

    const syncCart = () => {
      setCartCount(getCartCount());
      setCartBadgePulse(true);
      window.clearTimeout(cartPulseTimeout);
      cartPulseTimeout = window.setTimeout(() => setCartBadgePulse(false), 520);
    };

    const syncWishlist = () => {
      setWishlistCount(getWishlistCount());
      setWishlistBadgePulse(true);
      window.clearTimeout(wishlistPulseTimeout);
      wishlistPulseTimeout = window.setTimeout(() => setWishlistBadgePulse(false), 520);
    };

    const syncAuth = () => {
      setIsAuthenticated(Boolean(tokenStore.get()));
    };

    const handleStorage = (event) => {
      if (event.key && event.key !== "marketplace_cart") return;
      syncCart();
    };

    const animateBubbleToTarget = (sourceRect, targetRect, quantity, onComplete) => {
      if (!sourceRect || !targetRect) {
        onComplete();
        return;
      }

      setFlyingBubble({
        x: sourceRect.left + sourceRect.width / 2,
        y: sourceRect.top + sourceRect.height / 2,
        targetX: targetRect.left + targetRect.width / 2,
        targetY: targetRect.top + targetRect.height / 2,
        quantity
      });
      setBubbleActive(false);
      window.clearTimeout(bubbleStartTimeout);
      window.clearTimeout(bubbleEndTimeout);
      bubbleStartTimeout = window.setTimeout(() => setBubbleActive(true), 10);
      bubbleEndTimeout = window.setTimeout(() => {
        setFlyingBubble(null);
        setBubbleActive(false);
        onComplete();
      }, 760);
    };

    const handleCartAnimation = (event) => {
      const sourceRect = event?.detail?.sourceRect;
      const quantity = Math.max(1, Number(event?.detail?.quantity || 1));
      const cartRect = cartButtonRef.current?.getBoundingClientRect();
      animateBubbleToTarget(sourceRect, cartRect, quantity, syncCart);
    };

    const handleWishlistAnimation = (event) => {
      const sourceRect = event?.detail?.sourceRect;
      const quantity = Math.max(1, Number(event?.detail?.quantity || 1));
      const wishlistRect = wishlistButtonRef.current?.getBoundingClientRect();
      animateBubbleToTarget(sourceRect, wishlistRect, quantity, syncWishlist);
    };

    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());
    setIsAuthenticated(Boolean(tokenStore.get()));
    window.addEventListener("storage", handleStorage);
    window.addEventListener("cart:updated", syncCart);
    window.addEventListener("wishlist:updated", syncWishlist);
    window.addEventListener("auth:updated", syncAuth);
    window.addEventListener("cart:add-animation", handleCartAnimation);
    window.addEventListener("wishlist:add-animation", handleWishlistAnimation);

    return () => {
      window.clearTimeout(cartPulseTimeout);
      window.clearTimeout(wishlistPulseTimeout);
      window.clearTimeout(bubbleStartTimeout);
      window.clearTimeout(bubbleEndTimeout);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cart:updated", syncCart);
      window.removeEventListener("wishlist:updated", syncWishlist);
      window.removeEventListener("auth:updated", syncAuth);
      window.removeEventListener("cart:add-animation", handleCartAnimation);
      window.removeEventListener("wishlist:add-animation", handleWishlistAnimation);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const response = await marketplaceApi.safeGetCategories();
        if (!active) return;
        setCategories(Array.isArray(response?.data) ? response.data.slice(0, 8) : []);
      } catch {
        if (active) setCategories([]);
      }
    }

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  const categoryColumns = useMemo(() => {
    const cols = [[], []];
    categories.forEach((category, index) => {
      cols[index % 2].push(category);
    });
    return cols;
  }, [categories]);

  function submitSearch(event) {
    event.preventDefault();
    const nextQuery = query.trim();
    const params = new URLSearchParams();
    if (nextQuery) params.set("search", nextQuery);
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleVoiceSearch() {
    const Recognition = typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setVoiceListening(true);
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => setVoiceListening(false);
    recognition.onresult = (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || "";
      setQuery(transcript);
    };

    recognition.start();
  }

  return (
    <header className="z-30 border-b border-black/8 bg-[#f8f3ec]/92 backdrop-blur-xl">
      {flyingBubble ? (
        <div
          className="pointer-events-none fixed left-0 top-0 z-[80] flex h-8 min-w-8 items-center justify-center rounded-full bg-[#c07a34] px-2 text-xs font-bold text-white shadow-[0_12px_28px_rgba(192,122,52,0.35)] transition-[transform,opacity] duration-700"
          style={{
            transform: bubbleActive
              ? `translate(${flyingBubble.targetX - flyingBubble.x}px, ${flyingBubble.targetY - flyingBubble.y}px) scale(0.78)`
              : "translate(0px, 0px) scale(1)",
            opacity: bubbleActive ? 0.18 : 1,
            left: `${flyingBubble.x - 16}px`,
            top: `${flyingBubble.y - 16}px`
          }}
        >
          +{flyingBubble.quantity}
        </div>
      ) : null}

      <div className="border-b border-black/6 bg-ink text-white">
        <div className="shell-container flex min-h-[40px] flex-wrap items-center justify-between gap-3 py-2 text-[11px] sm:text-xs">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-white/85">
            <span>Free marketplace support for every order</span>
            <span>Fast seller contact flow</span>
            <span>Clean checkout experience</span>
          </div>
          <div className="hidden items-center gap-4 text-white/80 md:flex">
            {topBarLinks.map((link) => (
              <Link key={`${link.href}-${link.label}`} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="shell-container py-4">
        <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_280px] xl:items-center">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              MarketSphere
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((state) => !state)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-ink xl:hidden"
              aria-label="Toggle navigation"
            >
              <HeaderIcon type={mobileOpen ? "close" : "menu"} className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={submitSearch} className="hidden xl:block">
            <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-3 py-2 shadow-[0_10px_24px_rgba(16,32,26,0.06)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe5] text-slate-500">
                <HeaderIcon type="search" />
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, categories, and stores"
                className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm text-ink outline-none"
              />
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${voiceListening ? "bg-[#c07a34] text-white" : "bg-[#f6efe5] text-slate-600 hover:bg-[#eadfce]"}`}
                aria-label="Voice search"
              >
                <HeaderIcon type="mic" />
              </button>
              <button type="submit" className="rounded-full bg-[#c07a34] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a96b2d]">
                Search
              </button>
            </div>
          </form>

          <div className="hidden items-center justify-end gap-3 xl:flex">
            <Link
              ref={wishlistButtonRef}
              href="/wishlist"
              className="relative inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 pr-5 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
            >
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#f6efe5] text-slate-500">
                <HeaderIcon type="heart" className="h-4 w-4" />
                <span className={`absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#c07a34] px-1 text-[10px] font-bold text-white transition ${wishlistBadgePulse ? "scale-115" : "scale-100"}`}>
                  {wishlistCount}
                </span>
              </span>
            </Link>

            <Link
              ref={cartButtonRef}
              href="/cart"
              className="relative inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 pr-5 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
            >
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#f6efe5] text-slate-500">
                <HeaderIcon type="cart" className="h-4 w-4" />
                <span className={`absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#c07a34] px-1 text-[10px] font-bold text-white transition ${cartBadgePulse ? "scale-115" : "scale-100"}`}>
                  {cartCount}
                </span>
              </span>
            </Link>

            {isAuthenticated ? (
              <Link href="/account" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5">
                <HeaderIcon type="user" className="h-4 w-4 text-slate-500" />
                <span>Account</span>
              </Link>
            ) : (
              <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5">
                <HeaderIcon type="user" className="h-4 w-4 text-slate-500" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4 hidden items-center gap-6 xl:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMegaOpen((state) => !state)}
              className={`inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold transition ${megaOpen ? "bg-ink text-white" : "border border-black/10 bg-white text-ink hover:bg-white"}`}
            >
              <HeaderIcon type="grid" className="h-4 w-4" />
              Categories
              <HeaderIcon type={megaOpen ? "chevron-up" : "chevron-down"} className="h-3.5 w-3.5" />
            </button>

            {megaOpen ? (
              <div className="absolute left-0 top-[calc(100%+14px)] z-40 w-[760px] overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_20px_60px_rgba(16,32,26,0.12)]">
                {browseLinks.length ? (
                  <div className="grid grid-cols-[1.2fr_0.8fr]">
                    <div className="p-6">
                      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Browse menu</div>
                      <BrowseTree items={browseLinks} />
                    </div>

                    <div className="border-l border-black/6 bg-[#f8f3ec] p-6">
                      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Quick links</div>
                      <div className="grid gap-3">
                        {featuredCategoryLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[1.2fr_0.8fr]">
                    <div className="p-6">
                      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Browse categories</div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        {categoryColumns.map((column, index) => (
                          <div key={`col-${index}`} className="grid gap-3">
                            {column.map((category) => (
                              <Link
                                key={category._id || category.slug}
                                href={`/category/${category.slug}`}
                                className="rounded-[18px] border border-black/6 bg-[#fcfaf7] px-4 py-3 text-sm font-semibold text-ink transition hover:border-[#c07a34]/35 hover:bg-white"
                              >
                                {category.name}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-l border-black/6 bg-[#f8f3ec] p-6">
                      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Quick links</div>
                      <div className="grid gap-3">
                        {featuredCategoryLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <nav className="flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`rounded-full px-4 py-3 text-sm font-semibold transition ${isLinkActive(pathname, link.href) ? "bg-white text-ink shadow-sm" : "text-slate-700 hover:bg-white hover:text-ink"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {mobileOpen ? (
          <div className="mt-4 grid gap-4 rounded-[24px] border border-black/8 bg-white p-4 shadow-[0_14px_34px_rgba(16,32,26,0.08)] xl:hidden">
            <form onSubmit={submitSearch}>
              <div className="flex items-center gap-2 rounded-[18px] border border-black/10 bg-[#fcfaf7] px-3 py-2">
                <HeaderIcon type="search" className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products and stores"
                  className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${voiceListening ? "bg-[#c07a34] text-white" : "bg-white text-slate-600"}`}
                >
                  <HeaderIcon type="mic" className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="grid gap-2">
              {[...navLinks, ...(isAuthenticated ? [{ href: "/account", label: "Account" }] : [{ href: "/login", label: "Login" }])].map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-[16px] border border-black/8 bg-[#fcfaf7] px-4 py-3 text-sm font-semibold text-ink"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/vendor/dashboard" onClick={() => setMobileOpen(false)} className="rounded-[16px] bg-ink px-4 py-3 text-sm font-semibold text-white">
                Vendor Dashboard
              </Link>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Categories</div>
              {browseLinks.length ? (
                <BrowseTree items={browseLinks} mobile onNavigate={() => setMobileOpen(false)} />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {categories.map((category) => (
                    <Link
                      key={category._id || category.slug}
                      href={`/category/${category.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-[16px] border border-black/8 bg-[#fcfaf7] px-4 py-3 text-sm font-semibold text-ink"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Quick links</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {topBarLinks.map((link) => (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-[16px] border border-black/8 bg-[#fcfaf7] px-4 py-3 text-sm font-semibold text-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
