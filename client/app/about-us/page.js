import { PageIntro } from "@/components/storefront/PageIntro";
import { buildDesignedPageMetadata, loadDesignedPageSeo } from "@/lib/utils/designed-pages-seo";

const principles = [
  {
    title: "Marketplace clarity",
    description: "We design every customer and vendor flow to feel easier to understand, from listing structure to checkout states."
  },
  {
    title: "Operational control",
    description: "Admin and vendor tools are built to support day-to-day commerce work instead of looking polished but getting in the way."
  },
  {
    title: "Growth without clutter",
    description: "The platform is structured so categories, sellers, content, and support workflows can scale without turning the storefront into noise."
  }
];

export async function generateMetadata() {
  const seoPage = await loadDesignedPageSeo("about-us");
  return buildDesignedPageMetadata("About Us", seoPage);
}

export default function AboutUsPage() {
  return (
    <section className="container page-section stack">
      <PageIntro
        eyebrow="About"
        title="A marketplace built for cleaner operations and better browsing."
        description="MarketPlace is designed to help operators, vendors, and customers work inside one storefront without the usual friction between catalog quality, order handling, and support."
        actions={[
          { href: "/products", label: "Browse products" },
          { href: "/contact-us", label: "Contact us", variant: "secondary" }
        ]}
        stats={[
          { label: "Focus", value: "Clear UX", caption: "Interfaces designed for real ecommerce workflows." },
          { label: "Model", value: "Multi-vendor", caption: "One storefront with controlled seller operations." },
          { label: "Priority", value: "Trust", caption: "Content, policies, and support built into the experience." }
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-card p-8">
          <div className="eyebrow">What We Build</div>
          <h2 className="mt-3 text-3xl font-bold text-ink">Structured commerce without template-store noise.</h2>
          <div className="rich-content mt-6">
            <p>
              This storefront approach is built around clearer information architecture, better category depth, and admin tooling that can support a growing catalog without burying the important controls.
            </p>
            <p>
              Instead of treating content pages, seller operations, and customer support as separate systems, the marketplace keeps them coordinated so shoppers see a more reliable storefront and operators retain control where it matters.
            </p>
          </div>
        </article>

        <article className="glass-card p-8">
          <div className="eyebrow">Principles</div>
          <div className="mt-6 grid gap-4">
            {principles.map((item) => (
              <div key={item.title} className="rounded-3xl border border-black/8 bg-white/70 p-5">
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
