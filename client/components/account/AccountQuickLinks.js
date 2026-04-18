"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/returns", label: "Returns" },
  { href: "/support", label: "Support" }
];

export function AccountQuickLinks() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-3">
      {LINKS.map((link) => {
        const active = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "inline-flex min-h-11 items-center rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-5 text-sm font-semibold text-white"
                : "inline-flex min-h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
