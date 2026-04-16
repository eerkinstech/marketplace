import Link from "next/link";

export function SidePanel({ title, subtitle, items, children }) {
  return (
    <div className="min-h-screen bg-[#f5efe7] lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-black/10 bg-white/70 p-5 backdrop-blur-md lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <nav className="grid gap-2">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="p-6 lg:p-8">{children}</main>
    </div>
  );
}
