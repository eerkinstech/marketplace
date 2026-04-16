import Link from "next/link";
import { ProductCard } from "@/components/shared/ProductCard";
import { marketplaceApi } from "@/lib/api/marketplace";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data } = await marketplaceApi.safeGetStore(slug);

  if (!data) {
    return {
      title: "Store unavailable",
      description: "The store data is currently unavailable."
    };
  }

  return {
    title: data.vendor.storeName,
    description: data.vendor.storeDescription || `${data.vendor.storeName} storefront`
  };
}

export default async function StorePage({ params }) {
  const { slug } = await params;
  const { data } = await marketplaceApi.safeGetStore(slug);

  if (!data) {
    return (
      <section className="shell-container py-8 pb-12">
        <div className="glass-card p-8 text-sm text-slate-600">
          Store data is not available right now. Start the backend API and try again.
        </div>
      </section>
    );
  }

  return (
    <section className="shell-container py-8 pb-12">
      <div className="grid gap-6">
        <div className="surface-panel page-hero">
          <div className="relative z-10 section-heading">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-[26px] border border-black/8 bg-[#f4ede4]">
                  {data.vendor.storeLogo ? <img src={data.vendor.storeLogo} alt={`${data.vendor.storeName} logo`} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="h-20 w-20 overflow-hidden rounded-full border border-black/8 bg-[#efe8de]">
                  {data.vendor.profileImage ? <img src={data.vendor.profileImage} alt={`${data.vendor.storeName} owner`} className="h-full w-full object-cover" /> : null}
                </div>
              </div>
              <div className="eyebrow">Storefront</div>
              <h1 className="page-title mt-3">{data.vendor.storeName}</h1>
              <p className="muted-copy mt-4 max-w-3xl">
                {data.vendor.storeDescription || "Independent seller on MarketSphere."}
              </p>
            </div>
            <div className="hero-metrics">
              <div className="stat-chip">
                <div className="mini-label">Products</div>
                <strong className="mt-2 block text-3xl text-ink">{data.products.length}</strong>
              </div>
              <div className="stat-chip">
                <div className="mini-label">Support</div>
                <Link href={`/support?vendor=${data.vendor.storeSlug}`} className="mt-2 inline-flex text-lg font-semibold text-ink underline-offset-4 hover:underline">
                  Chat now
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="section-heading">
          <div>
            <div className="eyebrow">Store catalog</div>
            <h2 className="page-title mt-2">Products from {data.vendor.storeName}</h2>
          </div>
          <Link href={`/support?vendor=${data.vendor.storeSlug}`} className="btn-primary">
            Contact vendor support
          </Link>
        </div>
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          {data.products.map((product) => (
            <ProductCard key={product._id} product={{ ...product, vendor: data.vendor }} />
          ))}
        </div>
      </div>
    </section>
  );
}
