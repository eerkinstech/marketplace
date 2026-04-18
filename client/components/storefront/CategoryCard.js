import Link from "next/link";

export function CategoryCard({ category }) {
  return (
    <Link href={`/category/${category.slug}`} className="group flex flex-col items-center text-center">
      <article className="w-full">
        <div className="mx-auto flex w-full justify-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--secondary)_28%,var(--white))] shadow-[0_14px_30px_rgba(15,23,42,0.10)] transition duration-300 group-hover:scale-[1.04] group-hover:shadow-[0_18px_38px_rgba(15,23,42,0.16)] sm:h-32 sm:w-32">
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.08]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              {category.name}
            </div>
          )}
          </div>
        </div>
        <div className="px-2 pt-4">
          <h3 className="text-lg font-semibold leading-[1.25] tracking-[-0.02em] text-ink sm:text-[18px]">
            {category.name}
          </h3>
        </div>
      </article>
    </Link>
  );
}
