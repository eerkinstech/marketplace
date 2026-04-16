import Link from "next/link";

export function Hero() {
  return (
    <section className="shell-container grid gap-7 py-10 lg:grid-cols-[1.25fr_0.75fr] lg:py-16">
      <div className="surface-panel relative overflow-hidden p-8 md:p-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-glow via-brand to-ink" />
        <div className="eyebrow">Modern marketplace storefront</div>
        <h1 className="mt-3 max-w-4xl font-display text-5xl leading-[0.92] text-ink md:text-7xl">
          Buy from standout brands in a calm, premium shopping flow.
        </h1>
        <p className="muted-copy mt-5 max-w-3xl text-base md:text-lg">
          MarketSphere pairs curated discovery with vendor-powered breadth. Explore approved products, category-led
          browsing, clear product detail pages, and a checkout journey designed to feel polished from first click to order.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/products" className="btn-primary">Shop Products</Link>
          <Link href="/categories" className="btn-secondary">Browse Categories</Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="stat-chip">
            <div className="mini-label">Selection</div>
            <strong className="mt-2 block text-3xl text-ink">Curated</strong>
            <p className="mt-2 text-sm text-slate-600">Approved products only, surfaced with clear structure.</p>
          </div>
          <div className="stat-chip">
            <div className="mini-label">Shops</div>
            <strong className="mt-2 block text-3xl text-ink">Vendor-led</strong>
            <p className="mt-2 text-sm text-slate-600">Independent stores presented inside one consistent buying flow.</p>
          </div>
          <div className="stat-chip">
            <div className="mini-label">Checkout</div>
            <strong className="mt-2 block text-3xl text-ink">Simple</strong>
            <p className="mt-2 text-sm text-slate-600">A quieter, cleaner path from cart to order confirmation.</p>
          </div>
        </div>
      </div>
      <div className="surface-panel grid content-between gap-6 p-8 md:p-10">
        <div>
          <div className="eyebrow">Why it feels better</div>
          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
            The storefront uses category-led browsing, product-first storytelling, and restrained surfaces so the content stays
            readable and the buying decisions stay clear.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[20px] border border-black/5 bg-white/70 p-5">
            <span className="text-sm text-slate-500">Discovery</span>
            <strong className="mt-2 block text-3xl text-ink">Filters</strong>
          </div>
          <div className="rounded-[20px] border border-black/5 bg-white/70 p-5">
            <span className="text-sm text-slate-500">Product pages</span>
            <strong className="mt-2 block text-3xl text-ink">Trust</strong>
          </div>
          <div className="rounded-[20px] border border-black/5 bg-white/70 p-5">
            <span className="text-sm text-slate-500">Categories</span>
            <strong className="mt-2 block text-3xl text-ink">Depth</strong>
          </div>
          <div className="rounded-[20px] border border-black/5 bg-white/70 p-5">
            <span className="text-sm text-slate-500">Checkout</span>
            <strong className="mt-2 block text-3xl text-ink">Flow</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

