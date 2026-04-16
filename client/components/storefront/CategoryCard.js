import Link from "next/link";

export function CategoryCard({ category, productCount = 0 }) {
  return (
    <article className="surface-panel flex h-full flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="badge">Category</span>
          <h3 className="mt-3 font-display text-3xl leading-tight text-ink">{category.name}</h3>
        </div>
        <div className="rounded-full border border-black/10 bg-white/75 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-600">
          {productCount} items
        </div>
      </div>
      <p className="muted-copy text-sm">
        {category.description || "Browse curated products from verified marketplace sellers in this collection."}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-sm text-slate-500">Slug: {category.slug}</span>
        <Link className="btn-secondary" href={`/category/${category.slug}`}>
          Explore
        </Link>
      </div>
    </article>
  );
}

