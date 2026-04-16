import Link from "next/link";
import { formatCurrency, getDiscountPercent, getProductImage } from "@/lib/utils/storefront";

export function ProductCard({ product }) {
  const image = getProductImage(product);
  const discount = getDiscountPercent(product);

  return (
    <article className="product-card-shell group flex h-full flex-col">
      <Link href={`/product/${product.slug}`} className="product-card-media">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : <div className="flex h-full items-center justify-center text-sm" style={{ color: "color-mix(in srgb, var(--text) 55%, transparent)" }}>No image</div>}
        <div className="product-card-heart" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
            <path d="M12.1 20.3 4.9 13.4a4.9 4.9 0 0 1 6.9-7l.2.2.2-.2a4.9 4.9 0 0 1 6.9 7l-7.2 6.9Z" />
          </svg>
        </div>
      </Link>
      <div className="mt-4 flex flex-1 flex-col px-3 pb-1">
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-[18px] font-semibold leading-[1.15] tracking-[-0.03em]" style={{ color: "var(--black)" }}>
          {product.name}
        </Link>
        <div className="mt-3 text-[13px] font-medium" style={{ color: "color-mix(in srgb, var(--text) 68%, transparent)" }}>Lowest Ask</div>
        <div className="mt-1 flex items-end gap-3">
          <strong className="text-[28px] font-semibold leading-none tracking-[-0.04em]" style={{ color: "var(--black)" }}>
            {formatCurrency(product.price)}
          </strong>
          {product.compareAtPrice ? (
            <span className="pb-0.5 text-sm line-through" style={{ color: "color-mix(in srgb, var(--text) 34%, transparent)" }}>{formatCurrency(product.compareAtPrice)}</span>
          ) : null}
        </div>
        {discount ? (
          <div className="mt-3 text-[12px] font-medium uppercase tracking-[0.18em]" style={{ color: "color-mix(in srgb, var(--text) 48%, transparent)" }}>{discount}% off</div>
        ) : null}
      </div>
    </article>
  );
}
