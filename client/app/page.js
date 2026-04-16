import Link from "next/link";
import { HomeHeroSlider } from "@/components/home/HomeHeroSlider";
import { HomeHorizontalCarousel } from "@/components/home/HomeHorizontalCarousel";
import { marketplaceApi } from "@/lib/api/marketplace";
import { formatCurrency, getProductImage } from "@/lib/utils/storefront";

function getInitials(value = "") {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProductCard({ product }) {
  const image = getProductImage(product);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="product-card-dark group block min-w-[168px] sm:min-w-[184px] lg:min-w-[196px]"
    >
      <div className="product-card-media">
        {image ? (
          <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/55">No image</div>
        )}
        <div className="product-card-heart" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
            <path d="M12.1 20.3 4.9 13.4a4.9 4.9 0 0 1 6.9-7l.2.2.2-.2a4.9 4.9 0 0 1 6.9 7l-7.2 6.9Z" />
          </svg>
        </div>
      </div>
      <div className="mt-4 px-3 pb-1">
        <div className="line-clamp-2 text-[18px] font-semibold leading-[1.15] tracking-[-0.03em] text-white">{product.name}</div>
        <div className="mt-3 text-[13px] font-medium text-white/68">Lowest Ask</div>
        <div className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.04em] text-white">{formatCurrency(product.price)}</div>
      </div>
    </Link>
  );
}

function CategoryCard({ category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="block min-w-[164px] overflow-hidden rounded-[20px] text-[#111111] transition hover:-translate-y-1 sm:min-w-[176px] lg:min-w-[188px]"
      style={{ background: "var(--home-card-bg)", boxShadow: "var(--home-shadow)" }}
    >
      <div className="flex aspect-[1.38/1] items-center justify-center" style={{ background: "var(--home-accent-soft)" }}>
        {category.image ? (
          <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-black text-white" style={{ background: "var(--home-accent-strong)" }}>
            {getInitials(category.name)}
          </div>
        )}
      </div>
      <div className="px-4 py-3 text-sm font-semibold">{category.name}</div>
    </Link>
  );
}

function SectionHeader({ section }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {section.eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--home-accent)" }}>
            {section.eyebrow}
          </div>
        ) : null}
        {section.title ? (
          <h2 className="text-[28px] font-black tracking-[-0.03em] md:text-[30px]" style={{ color: "var(--color-ink)" }}>
            {section.title}
          </h2>
        ) : null}
        {section.subtitle ? (
          <p className="mt-1 text-sm" style={{ color: "var(--home-section-muted)" }}>
            {section.subtitle}
          </p>
        ) : null}
      </div>
      {section.ctaHref ? (
        <Link href={section.ctaHref} className="shrink-0 text-sm font-semibold" style={{ color: "var(--home-accent-strong)" }}>
          {section.ctaLabel || "See all"} 
        </Link>
      ) : null}
    </div>
  );
}

function BannerCard({ item, large = false }) {
  const background = item.backgroundColor || "linear-gradient(135deg, var(--home-hero-start) 0%, var(--home-hero-end) 100%)";
  const color = item.textColor || "var(--home-hero-text)";
  const accent = item.accentColor || "var(--home-accent-strong)";

  return (
    <article
      className={`relative overflow-hidden rounded-[28px] border ${large ? "min-h-[280px] lg:min-h-[300px]" : "min-h-[220px]"}`}
      style={{ background, color, borderColor: "var(--home-section-line)", boxShadow: "var(--home-shadow)" }}
    >
      <div className={`grid h-full items-center gap-5 ${large ? "p-6 md:grid-cols-[minmax(0,1fr)_300px] md:p-8" : "p-6"}`}>
        <div className="flex flex-col justify-center">
          {item.eyebrow ? <div className="text-[11px] uppercase tracking-[0.24em] opacity-75">{item.eyebrow}</div> : null}
          <h3 className={`${large ? "mt-2 text-3xl md:text-5xl" : "mt-2 text-3xl"} max-w-[11ch] font-black uppercase leading-[0.92]`}>
            {item.title}
          </h3>
          {item.subtitle ? (
            <p className="mt-3 max-w-md text-base md:text-lg" style={{ color: "var(--home-hero-muted)" }}>
              {item.subtitle}
            </p>
          ) : null}
          {item.href ? (
            <Link href={item.href} className="mt-5 inline-flex text-base font-black uppercase underline underline-offset-4 md:text-lg" style={{ color: accent }}>
              {item.label || "Shop now"}
            </Link>
          ) : null}
        </div>
        {item.imageUrl ? (
          <div className="flex items-center justify-center">
            <img src={item.imageUrl} alt={item.title || "Banner image"} className="max-h-[200px] w-full object-contain md:max-h-[250px]" />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function SurfaceSection({ section, children }) {
  return (
    <section
      className="rounded-[30px] px-5 py-6 md:px-6 md:py-7"
      style={{ background: "var(--home-section-bg)", border: "1px solid var(--home-section-line)", boxShadow: "var(--home-shadow)" }}
    >
      <SectionHeader section={section} />
      {children}
    </section>
  );
}

function renderSection(section) {
  if (section.sectionType === "hero_slider") {
    const slides = section.items?.length
      ? section.items
      : [{
        eyebrow: section.eyebrow,
        title: section.title,
        subtitle: section.subtitle,
        description: section.description,
        label: section.ctaLabel,
        href: section.ctaHref,
        imageUrl: section.imageUrl,
        backgroundColor: section.backgroundColor,
        textColor: section.textColor,
        accentColor: section.accentColor
      }];
    return <HomeHeroSlider slides={slides} />;
  }

  if (section.sectionType === "category_strip" || section.sectionType === "category_grid") {
    const categories = section.categories || [];
    if (!categories.length) return null;

    return (
      <SurfaceSection section={section}>
        {section.sectionType === "category_grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => <CategoryCard key={category._id} category={category} />)}
          </div>
        ) : (
          <HomeHorizontalCarousel ariaLabel={section.title || "categories"}>
            {categories.map((category) => <CategoryCard key={category._id} category={category} />)}
          </HomeHorizontalCarousel>
        )}
      </SurfaceSection>
    );
  }

  if (section.sectionType === "product_carousel" || section.sectionType === "product_grid") {
    const products = section.products || [];
    if (!products.length) return null;

    return (
      <SurfaceSection section={section}>
        {section.sectionType === "product_grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {products.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        ) : (
          <HomeHorizontalCarousel ariaLabel={section.title || "products"}>
            {products.map((product) => <ProductCard key={product._id} product={product} />)}
          </HomeHorizontalCarousel>
        )}
      </SurfaceSection>
    );
  }

  if (section.sectionType === "banner") {
    const item = section.items?.[0] || {
      eyebrow: section.eyebrow,
      title: section.title,
      subtitle: section.subtitle,
      label: section.ctaLabel,
      href: section.ctaHref,
      imageUrl: section.imageUrl,
      backgroundColor: section.backgroundColor,
      textColor: section.textColor,
      accentColor: section.accentColor
    };
    return <BannerCard item={item} large />;
  }

  if (section.sectionType === "split_banner") {
    const items = section.items || [];
    if (!items.length) return null;

    return (
      <section className="grid gap-5 py-1 lg:grid-cols-2">
        {items.slice(0, 2).map((item, index) => (
          <BannerCard key={`${item.title}-${index}`} item={item} />
        ))}
      </section>
    );
  }

  if (section.sectionType === "article_grid") {
    const items = section.items || [];
    if (!items.length) return null;

    return (
      <SurfaceSection section={section}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item, index) => (
            <Link
              key={`${item.title}-${index}`}
              href={item.href || "#"}
              className="overflow-hidden rounded-[24px] transition hover:-translate-y-1"
              style={{ background: "var(--home-card-bg)", color: "var(--color-ink)", boxShadow: "var(--home-shadow)" }}
            >
              {item.imageUrl ? (
                <div className="aspect-[1.25/1] overflow-hidden">
                  <img src={item.imageUrl} alt={item.title || "Article"} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="p-4">
                <div className="line-clamp-2 text-lg font-bold leading-6">{item.title}</div>
                {item.subtitle ? (
                  <div className="mt-2 text-sm" style={{ color: "var(--home-section-muted)" }}>
                    {item.subtitle}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </SurfaceSection>
    );
  }

  return null;
}

function buildFallbackSections(items, categories) {
  const featuredCategories = categories.slice(0, 5);

  return [
    {
      _id: "fallback-hero",
      sectionType: "hero_slider",
      items: [
        {
          eyebrow: "MarketSphere Edit",
          title: "Shop the latest drops",
          subtitle: "Dynamic homepage sections now come from admin collections.",
          description: "Use Admin > Collections to control hero slides, banners, product rows, and category rows without editing code.",
          label: "Shop now",
          href: "/products",
          imageUrl: getProductImage(items[0]),
          backgroundColor: "linear-gradient(135deg, var(--home-hero-start) 0%, var(--home-hero-end) 100%)",
          accentColor: "var(--home-accent-strong)",
          textColor: "var(--home-hero-text)"
        }
      ]
    },
    {
      _id: "fallback-categories",
      sectionType: "category_strip",
      title: "Popular Categories",
      ctaLabel: "See all",
      ctaHref: "/categories",
      categories: featuredCategories
    },
    {
      _id: "fallback-products-1",
      sectionType: "product_carousel",
      title: "Recommended For You",
      ctaLabel: "See all",
      ctaHref: "/products",
      products: items.slice(0, 12)
    },
    {
      _id: "fallback-banner",
      sectionType: "banner",
      items: [{
        title: "Curated collections, admin controlled",
        subtitle: "Mix banners, categories, and product blocks across the homepage.",
        label: "Open collections",
        href: "/admin/collections",
        imageUrl: getProductImage(items[1]),
        backgroundColor: "linear-gradient(135deg, #dff4ea 0%, #fffdfa 100%)",
        accentColor: "var(--home-accent-strong)",
        textColor: "var(--home-hero-text)"
      }]
    },
    {
      _id: "fallback-products-2",
      sectionType: "product_grid",
      title: "Trending Products",
      ctaLabel: "Shop all",
      ctaHref: "/products?sort=popular",
      products: items.slice(12, 24)
    }
  ];
}

export default async function Home() {
  const [{ data: productData }, { data: categories }, { data: homeSectionsData }] = await Promise.all([
    marketplaceApi.safeGetProducts("?limit=48&sort=popular"),
    marketplaceApi.safeGetCategories(),
    marketplaceApi.safeGetHomeSections()
  ]);

  const items = productData.items || [];
  const homeSections = homeSectionsData?.length ? homeSectionsData : buildFallbackSections(items, categories);
  const isApiOffline = items.length === 0 && categories.length === 0 && (!homeSectionsData || homeSectionsData.length === 0);

  return (
    <section className="py-6 pb-14 md:py-8 md:pb-16" style={{ background: "var(--home-page-bg)" }}>
      <div className="shell-container">
        {isApiOffline ? (
          <div className="mb-6 rounded-[22px] p-5 text-sm" style={{ border: "1px solid var(--home-section-line)", background: "var(--home-section-bg)", color: "var(--home-section-muted)" }}>
            Backend API is not reachable yet. Start the server on <span className="font-semibold" style={{ color: "var(--color-ink)" }}>http://localhost:5000</span> to load live homepage sections.
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap items-center gap-2 overflow-x-auto pb-2 text-sm font-semibold" style={{ color: "var(--home-section-muted)" }}>
          {["All", "Brands", "Trending", "New", "Deals", "Men", "Women", "Kids", "Sneakers", "Shoes", "Accessories", "More"].map((label) => (
            <span
              key={label}
              className="rounded-full px-4 py-2"
              style={{
                background: label === "Deals" ? "var(--home-accent-soft)" : "rgba(255,255,255,0.72)",
                color: label === "Deals" ? "var(--home-accent-strong)" : "var(--home-section-muted)",
                border: "1px solid var(--home-section-line)"
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-10">
          {homeSections.map((section, index) => (
            <div key={section._id || section.slug || `section-${index}`} className="py-1">
              {renderSection(section)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
