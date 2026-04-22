import { marketplaceApi } from "@/lib/api/marketplace";
import { getImageSource } from "@/lib/utils/images";
import { cleanMetaDescription, cleanPageTitle } from "@/lib/utils/metadata";
import { DEFAULT_CURRENCY, SITE_NAME, SITE_URL } from "@/lib/constants/site";
import ProductDetailClient from "@/components/product/ProductDetailClient";

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: product } = await marketplaceApi.safeGetProduct(slug);

  if (!product) {
    return {
      title: "Product unavailable",
      description: "The product data is currently unavailable."
    };
  }

  const title = cleanPageTitle(product.seo?.metaTitle, product.name);
  const description = cleanMetaDescription(product.seo?.metaDescription, product.shortDescription || stripHtml(product.description).slice(0, 155));
  const image = getImageSource(product.images?.[0]);
  const canonical = `/product/${product.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: product.images?.[0]?.alt || product.name }] : undefined
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const { data: product } = await marketplaceApi.safeGetProduct(slug);

  if (!product) {
    return (
      <section className="shell-container py-8 pb-12">
        <div className="glass-card p-8 text-sm text-slate-600">
          Product data is not available right now. Start the backend API and try again.
        </div>
      </section>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || stripHtml(product.description),
    image: product.images?.map((image) => getImageSource(image)).filter(Boolean) || [],
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.merchant?.brand || product.vendor?.storeName || SITE_NAME
    },
    url: `${SITE_URL}/product/${product.slug}`,
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: DEFAULT_CURRENCY,
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    aggregateRating: product.ratingCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: product.ratingAverage,
      reviewCount: product.ratingCount
    } : undefined
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetailClient product={product} />
    </>
  );
}
