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
      data-carousel-item
      className="product-card-shell group block min-w-[148px] sm:min-w-[164px] lg:min-w-[184px]"
    >
      <div className="product-card-media">
        {image ? (
          <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs" style={{ color: "color-mix(in srgb, var(--text) 55%, transparent)" }}>No image</div>
        )}
        <div className="product-card-heart" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
            <path d="M12.1 20.3 4.9 13.4a4.9 4.9 0 0 1 6.9-7l.2.2.2-.2a4.9 4.9 0 0 1 6.9 7l-7.2 6.9Z" />
          </svg>
        </div>
      </div>
      <div className="mt-4 px-3 pb-1">
        <div className="line-clamp-2 text-[18px] font-semibold leading-[1.15] tracking-[-0.03em]" style={{ color: "var(--black)" }}>{product.name}</div>
        <div className="mt-3 text-[13px] font-medium" style={{ color: "color-mix(in srgb, var(--text) 68%, transparent)" }}>Lowest Ask</div>
        <div className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.04em]" style={{ color: "var(--black)" }}>{formatCurrency(product.price)}</div>
      </div>
    </Link>
  );
}

function CategoryCard({ category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      data-carousel-item
      className="group flex min-w-[132px] snap-start flex-col items-center gap-3 rounded-[26px] px-2 py-3 text-center transition hover:-translate-y-1 sm:min-w-[136px] lg:min-w-[138px]"
      style={{ color: "var(--text)" }}
    >
      <div
        className="flex h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-full border transition duration-300 group-hover:shadow-[0_18px_34px_color-mix(in_srgb,var(--text)_16%,transparent)]"
        style={{ background: "var(--secondary)", borderColor: "color-mix(in srgb, var(--text) 8%, transparent)" }}
      >
        {category.image ? (
          <img src={category.image} alt={category.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full text-lg font-black" style={{ background: "var(--primary)", color: "var(--white)" }}>
            {getInitials(category.name)}
          </div>
        )}
      </div>
      <div className="line-clamp-2 text-[13px] font-semibold leading-5 sm:text-sm">{category.name}</div>
    </Link>
  );
}

function CompactCategoryCard({ category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      data-carousel-item
      className="group flex shrink-0 snap-start flex-col rounded-[22px] text-center transition hover:-translate-y-1"
      style={{
        color: "var(--text)",
        flex: "0 0 calc((100% - 0.75rem) / 3)",
        maxWidth: "calc((100% - 0.75rem) / 3)"
      }}
    >
      <div
        className="overflow-hidden rounded-[18px] transition duration-300 group-hover:shadow-[0_18px_34px_color-mix(in_srgb,var(--text)_12%,transparent)]"
        style={{
          background: "color-mix(in srgb, var(--secondary) 62%, var(--white))",
          border: "1px solid color-mix(in srgb, var(--text) 8%, transparent)"
        }}
      >
        {category.image ? (
          <img src={category.image} alt={category.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
        ) : (
          <div className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" style={{ background: "var(--primary)", color: "var(--white)" }}>
            {getInitials(category.name)}
          </div>
        )}
      </div>
      <div className="mt-3 line-clamp-2 text-[13px] font-semibold leading-5 sm:text-[14px]">{category.name}</div>
    </Link>
  );
}

function SectionHeader({ section }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {section.eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent)" }}>
            {section.eyebrow}
          </div>
        ) : null}
        {section.title ? (
          <h2 className="text-[28px] font-black tracking-[-0.03em] md:text-[30px]" style={{ color: "var(--text)" }}>
            {section.title}
          </h2>
        ) : null}
        {section.subtitle ? (
          <p className="mt-1 text-sm" style={{ color: "var(--text)" }}>
            {section.subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PromoCollectionCard({ title, href, items = [] }) {
  return (
    <article
      className="rounded-[26px] p-6 text-white"
      style={{
        background: "var(--primary)",
        boxShadow: "var(--home-shadow)"
      }}
    >
      <Link href={href || "/products"} className="inline-flex text-[15px] font-bold leading-none transition hover:opacity-90 md:text-[17px]">
        {title}
      </Link>

      <div className="mt-5 grid grid-cols-2 gap-4">
        {items.slice(0, 4).map((item, index) => (
          <Link key={`${item.href}-${index}`} href={item.href} className="group block">
            <div
              className="overflow-hidden rounded-[14px] bg-white p-3 shadow-[0_12px_24px_rgba(12,24,64,0.14)] transition duration-300 group-hover:-translate-y-1"
            >
              <div className="aspect-[1/1] overflow-hidden rounded-[10px]" style={{ background: "color-mix(in srgb, var(--secondary) 72%, var(--white))" }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.label} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
                ) : (
                  <div className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold" style={{ color: "var(--text)" }}>
                    {item.label}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 text-[13px] font-medium md:text-[15px]">{item.label}</div>
          </Link>
        ))}
      </div>
    </article>
  );
}

function PromoFeaturedCategoryCard({ category }) {
  if (!category) return null;

  return (
    <article
      className="relative overflow-hidden rounded-[26px] px-6 py-8 text-center text-white"
      style={{
        background: "var(--primary)",
        boxShadow: "var(--home-shadow)"
      }}
    >
      <div className="text-[12px] font-semibold uppercase tracking-[0.24em] text-white/72">
        Featured Category
      </div>
      <h3 className="mx-auto mt-3 max-w-[12ch] text-[24px] font-black leading-[1.12] tracking-[-0.03em] md:text-[32px]">
        {category.name}
      </h3>
      <Link href={`/category/${category.slug}`} className="mx-auto mt-8 block max-w-[320px]">
        <div className="overflow-hidden rounded-[26px] border border-white/16 bg-white p-4 shadow-[0_20px_36px_rgba(15,23,42,0.18)]">
          <div className="aspect-[1/1] overflow-hidden rounded-[18px]" style={{ background: "color-mix(in srgb, var(--secondary) 72%, var(--white))" }}>
            {category.image ? (
              <img src={category.image} alt={category.name} className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]" />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-xl font-black" style={{ color: "var(--text)" }}>
                {category.name}
              </div>
            )}
          </div>
        </div>
      </Link>


      <Link href={`/category/${category.slug}`} className="mt-2 inline-flex text-[17px] font-black underline underline-offset-4 md:text-[18px]">
        Shop {category.name}
      </Link>
    </article>
  );
}

function PromoShowcaseSection({ section }) {
  const leftItems = section.leftItems || [];
  const rightItems = section.rightItems || [];

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_1.12fr_1fr]">
      <PromoCollectionCard title={section.leftTitle || "Top Picks"} href={section.leftHref} items={leftItems} />
      <PromoFeaturedCategoryCard category={section.centerCategory} />
      <PromoCollectionCard title={section.rightTitle || "Self care"} href={section.rightHref} items={rightItems} />
    </section>
  );
}

function CategoryShowcaseMosaic({ section }) {
  const items = (section.items || []).slice(0, 8);
  if (!items.length) return null;

  return (
    <section className="rounded-[30px] border p-3 md:p-4" style={{ background: "var(--white)", borderColor: "var(--color-line)", boxShadow: "var(--home-shadow)" }}>
      <div className="mb-5 px-2 pt-1 md:px-3">
        {section.eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent)" }}>
            {section.eyebrow}
          </div>
        ) : null}
        <h2 className="mt-2 text-[28px] font-black tracking-[-0.03em] md:text-[32px]" style={{ color: "var(--text)" }}>
          {section.title || "Shop by Room"}
        </h2>
        {section.subtitle ? (
          <p className="mt-2 text-sm md:text-base" style={{ color: "color-mix(in srgb, var(--text) 78%, var(--white))" }}>
            {section.subtitle}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => {
          const isOverlay = index === items.length - 1;
          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              className="group relative block overflow-hidden rounded-[20px]"
              style={{ minHeight: 230 }}
            >
              <div className="absolute inset-0" style={{ background: "color-mix(in srgb, var(--secondary) 64%, var(--white))" }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                ) : null}
              </div>

              <div
                className="absolute inset-0 transition duration-300"
                style={{
                  background: isOverlay
                    ? "color-mix(in srgb, var(--black) 48%, transparent)"
                    : "linear-gradient(180deg, transparent 45%, color-mix(in srgb, var(--black) 28%, transparent) 100%)"
                }}
              />

              <div className={`absolute inset-x-0 z-10 ${isOverlay ? "bottom-0 flex h-full items-end p-5 md:p-6" : "bottom-0 p-4 md:p-5"}`}>
                <div>
                  <div className="text-lg font-bold text-white md:text-[21px]">{item.title}</div>
                  {isOverlay ? (
                    <div className="mt-2 inline-flex text-sm font-bold underline underline-offset-4 text-white">
                      Explore & Shop All
                    </div>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ThreeColumnCategorySection({ section }) {
  const categories = section.categories || [];

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
      <article
        className="min-w-0 rounded-[26px] px-6 py-7"
        style={{
          background: "color-mix(in srgb, var(--secondary) 52%, var(--white))",
          border: "1px solid var(--color-line)",
          boxShadow: "var(--home-shadow)"
        }}
      >
        {section.leftEyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--primary)" }}>
            {section.leftEyebrow}
          </div>
        ) : null}
        <h3 className="mt-3 text-[25px] font-black leading-[1.02] tracking-[-0.04em]" style={{ color: "var(--text)" }}>
          {section.leftTitle}
        </h3>
        <p className="mt-4 text-[15px] leading-7" style={{ color: "color-mix(in srgb, var(--text) 78%, var(--white))" }}>
          {section.leftContent}
        </p>
        {section.leftHref ? (
          <Link href={section.leftHref} className="mt-6 inline-flex text-sm font-bold underline underline-offset-4" style={{ color: "var(--primary)" }}>
            {section.leftLabel || "Explore now"}
          </Link>
        ) : null}
      </article>

      <article
        className="min-w-0 overflow-hidden rounded-[26px] px-5 py-6"
        style={{
          background: "var(--white)",
          border: "1px solid var(--color-line)",
          boxShadow: "var(--home-shadow)"
        }}
      >
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            {section.centerEyebrow ? (
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent)" }}>
                {section.centerEyebrow}
              </div>
            ) : null}
            <h3 className="mt-2 text-[28px] font-black tracking-[-0.03em]" style={{ color: "var(--text)" }}>
              {section.centerTitle}
            </h3>
          </div>
        </div>

        <HomeHorizontalCarousel ariaLabel={section.centerTitle || "categories"} stepMode="item">
          {categories.map((category) => <CompactCategoryCard key={category._id || category.slug} category={category} />)}
        </HomeHorizontalCarousel>
      </article>

      <article
        className="min-w-0 rounded-[26px] px-6 py-7"
        style={{
          background: "color-mix(in srgb, var(--secondary) 38%, var(--white))",
          border: "1px solid var(--color-line)",
          boxShadow: "var(--home-shadow)"
        }}
      >
        {section.rightEyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--primary)" }}>
            {section.rightEyebrow}
          </div>
        ) : null}
        <h3 className="mt-3 text-[25px] font-black leading-[1.02] tracking-[-0.04em]" style={{ color: "var(--text)" }}>
          {section.rightTitle}
        </h3>
        <p className="mt-4 text-[15px] leading-7" style={{ color: "color-mix(in srgb, var(--text) 78%, var(--white))" }}>
          {section.rightContent}
        </p>
        {section.rightHref ? (
          <Link href={section.rightHref} className="mt-6 inline-flex text-sm font-bold underline underline-offset-4" style={{ color: "var(--primary)" }}>
            {section.rightLabel || "Learn more"}
          </Link>
        ) : null}
      </article>
    </section>
  );
}

function SurfaceSection({ section, children }) {
  return (
    <section
      className="rounded-[30px] px-5 py-3 md:px-6 md:py-4"
      style={{ background: "color-mix(in srgb, var(--white) 88%, transparent)", border: "1px solid var(--color-line)", boxShadow: "var(--home-shadow)" }}
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
          <HomeHorizontalCarousel ariaLabel={section.title || "categories"} stepMode="item">
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
          <HomeHorizontalCarousel ariaLabel={section.title || "products"} stepMode="item">
            {products.map((product) => <ProductCard key={product._id} product={product} />)}
          </HomeHorizontalCarousel>
        )}
      </SurfaceSection>
    );
  }

  if (section.sectionType === "promo_showcase") {
    return <PromoShowcaseSection section={section} />;
  }

  if (section.sectionType === "category_mosaic") {
    return <CategoryShowcaseMosaic section={section} />;
  }

  if (section.sectionType === "three_col_category") {
    return <ThreeColumnCategorySection section={section} />;
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
              style={{ background: "var(--white)", color: "var(--text)", boxShadow: "var(--home-shadow)" }}
            >
              {item.imageUrl ? (
                <div className="aspect-[1.25/1] overflow-hidden">
                  <img src={item.imageUrl} alt={item.title || "Article"} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="p-4">
                <div className="line-clamp-2 text-lg font-bold leading-6">{item.title}</div>
                {item.subtitle ? (
                  <div className="mt-2 text-sm" style={{ color: "var(--text)" }}>
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
  const featuredCategories = categories;
  const leftPromoItems = categories.slice(0, 4).map((category) => ({
    label: category.name,
    href: `/category/${category.slug}`,
    imageUrl: category.image
  }));
  const rightPromoItems = categories.slice(4, 8).map((category) => ({
    label: category.name,
    href: `/category/${category.slug}`,
    imageUrl: category.image
  }));
  const centerPromoCategory = categories[8] || categories[0] || null;
  const categoryMosaicItems = categories.slice(0, 8).map((category) => ({
    title: category.name,
    href: `/category/${category.slug}`,
    imageUrl: category.image
  }));

  return [
    {
      _id: "fallback-hero",
      sectionType: "hero_slider",
      items: [
        {
          eyebrow: "Fresh Arrivals",
          title: "Shop the latest drops",
          subtitle: "Curated marketplace picks for clean daily essentials and standout finds.",
          description: "Discover new products from trusted stores across the marketplace.",
          label: "Shop now",
          href: "/products",
          imageUrl: getProductImage(items[0]),
          backgroundColor: "linear-gradient(135deg, color-mix(in srgb, var(--white) 96%, var(--secondary)) 0%, color-mix(in srgb, var(--background) 93%, var(--white)) 50%, color-mix(in srgb, var(--secondary) 62%, var(--white)) 100%)",
          accentColor: "var(--primary)",
          textColor: "var(--text)"
        },
        {
          eyebrow: "Best Sellers",
          title: "Upgrade your everyday setup",
          subtitle: "Smart tech, useful gear, and refined accessories for work and travel.",
          description: "Browse practical pieces designed to make daily routines feel sharper.",
          label: "Explore tech",
          href: "/products?sort=popular",
          imageUrl: getProductImage(items[1] || items[0]),
          backgroundColor: "linear-gradient(135deg, color-mix(in srgb, var(--secondary) 78%, var(--white)) 0%, color-mix(in srgb, var(--white) 95%, var(--background)) 100%)",
          accentColor: "var(--primary)",
          textColor: "var(--text)"
        },
        {
          eyebrow: "Style Edit",
          title: "New season standout picks",
          subtitle: "Refined apparel, accessories, and lifestyle pieces selected for the week.",
          description: "Fresh combinations from growing brands and marketplace favorites.",
          label: "View collection",
          href: "/products",
          imageUrl: getProductImage(items[2] || items[0]),
          backgroundColor: "linear-gradient(135deg, color-mix(in srgb, var(--white) 97%, var(--accent) 10%) 0%, color-mix(in srgb, var(--white) 94%, var(--secondary)) 100%)",
          accentColor: "var(--primary)",
          textColor: "var(--text)"
        },
        {
          eyebrow: "Home & Living",
          title: "Refresh your space simply",
          subtitle: "Furniture accents, decor, and home essentials with a cleaner premium feel.",
          description: "Bring warmth and utility into your rooms with curated marketplace picks.",
          label: "Shop home",
          href: "/categories",
          imageUrl: getProductImage(items[3] || items[0]),
          backgroundColor: "linear-gradient(135deg, color-mix(in srgb, var(--background) 95%, var(--white)) 0%, color-mix(in srgb, var(--secondary) 56%, var(--white)) 100%)",
          accentColor: "var(--primary)",
          textColor: "var(--text)"
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
      _id: "fallback-three-col-category",
      sectionType: "three_col_category",
      leftEyebrow: "Shop better",
      leftTitle: "Browse category",
      leftContent: "Jump into the categories customers shop most, from elevated home finds to daily essentials and modern tech upgrades.",
      leftHref: "/categories",
      leftLabel: "View categories",
      centerEyebrow: "Category edit",
      centerTitle: "Discover Categories",
      categories: categories.slice(0, 10),
      rightEyebrow: "Fresh picks",
      rightTitle: "Find the right Product",
      rightContent: "Use category-led browsing to move quickly into the products, styles, and collections that fit what you want right now.",
      rightHref: "/products",
      rightLabel: "Browse products"
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
      _id: "fallback-products-2",
      sectionType: "product_grid",
      title: "Trending Products",
      ctaLabel: "Shop all",
      ctaHref: "/products?sort=popular",
      products: items.slice(12, 24)
    },
    {
      _id: "fallback-category-mosaic",
      sectionType: "category_mosaic",
      eyebrow: "Category Spotlight",
      title: "Explore Categories By Space",
      subtitle: "Browse refined category collections through a more visual home edit.",
      items: categoryMosaicItems
    },
    {
      _id: "fallback-promo-showcase",
      sectionType: "promo_showcase",
      leftTitle: "Ready for an upgrade?",
      leftHref: "/products?sort=popular",
      leftItems: leftPromoItems,
      centerCategory: centerPromoCategory,
      rightTitle: "Self care",
      rightHref: "/category/beauty-skincare",
      rightItems: rightPromoItems
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
    <section className="py-3 pb-5 md:py-5 md:pb-5" style={{ background: "var(--white)" }}>
      <div className="w-[100%] mx-auto px-4 sm:px-6 lg:px-8">
        {isApiOffline ? (
          <div className="mb-6 rounded-[22px] p-5 text-sm" style={{ border: "1px solid var(--color-line)", background: "color-mix(in srgb, var(--white) 88%, transparent)", color: "var(--text)" }}>
            Backend API is not reachable yet. Start the server on <span className="font-semibold" style={{ color: "var(--text)" }}>http://localhost:5000</span> to load live homepage sections.
          </div>
        ) : null}

        <div className="flex flex-col gap-5">
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
