import { marketplaceApi } from "@/lib/api/marketplace";
import { getImageSource } from "@/lib/utils/images";
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

  return {
    title: product.name,
    description: product.shortDescription || stripHtml(product.description).slice(0, 140)
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
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetailClient product={product} />
    </>
  );
}
