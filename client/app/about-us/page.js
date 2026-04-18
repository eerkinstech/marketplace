import Link from "next/link";
import { buildDesignedPageMetadata, loadDesignedPageSeo } from "@/lib/utils/designed-pages-seo";

const principles = [
  {
    title: "Marketplace clarity",
    description: "Every customer path, seller workflow, and admin control is designed to feel easier to understand at a glance."
  },
  {
    title: "Operational control",
    description: "The platform is structured for the real work behind ecommerce: catalog updates, approvals, order handling, and support."
  },
  {
    title: "Growth without clutter",
    description: "As categories, products, and vendors expand, the experience stays organized instead of turning into a noisy storefront."
  }
];

const pillars = [
  {
    title: "A stronger storefront layer",
    text: "The customer side is built around cleaner hierarchy, calmer product discovery, and category structure that supports deeper browsing."
  },
  {
    title: "Tools for ongoing operations",
    text: "Admin and vendor surfaces are meant for daily execution, not just launch-day demos. Pricing, inventory, content, and approvals stay close to the work."
  },
  {
    title: "Trust built into the flow",
    text: "Returns, support, account history, and product information are treated as part of the shopping experience, not as disconnected afterthoughts."
  }
];

const highlights = [
  { label: "Storefront focus", value: "Clear discovery" },
  { label: "Platform model", value: "Multi-vendor" },
  { label: "Operating goal", value: "Less friction" },
  { label: "Design priority", value: "Practical clarity" }
];

const workflow = [
  "Structured categories and collection pages help shoppers move from broad exploration into focused product decisions.",
  "Vendor workflows support publishing, stock updates, media management, and product maintenance without crossing into admin-only controls.",
  "Admin tools keep platform-wide visibility over approvals, catalog quality, site content, and marketplace governance.",
  "Support and policy surfaces are designed to reduce confusion before it becomes a support ticket."
];

export async function generateMetadata() {
  const seoPage = await loadDesignedPageSeo("about-us");
  return buildDesignedPageMetadata("About Us", seoPage);
}

export default function AboutUsPage() {
  return (
    <section className="container page-section stack">
      <div
        className="overflow-hidden rounded-[36px] border border-black/8 px-6 py-8 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10 lg:py-10"
        style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--white) 96%, transparent) 0%, color-mix(in srgb, var(--secondary) 20%, var(--white)) 45%, color-mix(in srgb, var(--accent) 10%, var(--white)) 100%)" }}
      >
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="eyebrow">About the marketplace</div>
            <h1 className="mt-3 max-w-4xl text-4xl font-medium font-black tracking-[-0.04em] text-ink sm:text-5xl">
              Commerce designed to feel more structured, more usable, and easier to run.
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              This marketplace is built around a simple goal: make browsing cleaner for customers while keeping real operational control for vendors and admins. Instead of separating storefront experience from platform work, both sides are shaped to support each other.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">
                Browse products
              </Link>
              <Link href="/contact-us" className="btn-secondary">
                Contact us
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-black/8 bg-white/75 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                <div className="mt-3 text-2xl font-black tracking-[-0.03em] text-ink font-medium">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="glass-card p-8">
          <div className="eyebrow">What we build</div>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ink">A marketplace that gives structure to both shopping and operations.</h2>
          <div className="rich-content mt-6 font-medium">
            <p>
              The storefront side is shaped for better decision-making: stronger product hierarchy, cleaner category depth, and page layouts that reduce unnecessary visual noise. Customers should be able to understand where they are, what they are looking at, and what to do next without guesswork.
            </p>
            <p>
              The operational side follows the same principle. Vendor and admin tools should support repetitive day-to-day work such as approvals, media handling, inventory updates, catalog fixes, and order visibility without becoming hard to maintain as the platform grows.
            </p>
            <p>
              That is why the marketplace treats browsing experience, content quality, and internal controls as connected layers instead of separate systems competing with each other.
            </p>
          </div>
        </article>

        <article className="glass-card p-8">
          <div className="eyebrow">Core principles</div>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {pillars.map((item) => (
          <article key={item.title} className="glass-card p-8">
            <div className="eyebrow">Platform pillar</div>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-ink">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.text}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="glass-card p-8">
          <div className="eyebrow">How it works</div>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ink">A coordinated flow from category browsing to platform management.</h2>
          <div className="mt-6 grid gap-4">
            {workflow.map((item) => (
              <div key={item} className="rounded-3xl border border-black/8 bg-white/70 px-5 py-4 text-sm leading-7 text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card p-8">
          <div className="eyebrow">Why this matters</div>
          <div className="rich-content mt-6 font-medium">
            <h2>Better browsing improves trust</h2>
            <p>Customers stay more confident when categories, product information, pricing, reviews, and support surfaces feel like one coherent system.</p>
            <h2>Better internal tools improve consistency</h2>
            <p>Vendors and admins make fewer avoidable mistakes when product management, approvals, media, and operational settings are built around practical workflows.</p>
            <h2>Better structure supports growth</h2>
            <p>As the catalog expands, a well-ordered marketplace can add new categories, products, and operational complexity without losing readability or control.</p>
          </div>
        </article>
      </div>

      <div
        className="rounded-[32px] border border-black/8 px-6 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:px-8"
        style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--white) 95%, transparent) 0%, color-mix(in srgb, var(--secondary) 18%, var(--white)) 100%)" }}
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="eyebrow">Next step</div>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ink">Explore the storefront or reach the team behind it.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              If you want to see how this structure works in practice, browse the product catalog and category pages. If you need support, operations help, or business discussion, the contact page routes you to the right place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/categories" className="btn-secondary">
              View categories
            </Link>
            <Link href="/contact-us" className="btn-primary">
              Get in touch
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
