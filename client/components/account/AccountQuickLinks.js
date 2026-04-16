"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/products", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/returns", label: "Return Form" },
  { href: "/account/returns", label: "Return Page" },
  { href: "/support", label: "Chat Page" },
  { href: "/account/orders", label: "Orders" }
];

export function AccountQuickLinks() {
  const pathname = usePathname();

  return (
    <div className="glass-card mb-6 p-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Account Pages</div>
      <div className="flex flex-wrap gap-3">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "border border-black/10 bg-white text-ink hover:-translate-y-0.5"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
