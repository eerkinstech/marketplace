import { PageIntro } from "@/components/storefront/PageIntro";
import { buildDesignedPageMetadata, loadDesignedPageSeo } from "@/lib/utils/designed-pages-seo";

const contactChannels = [
  {
    title: "Customer support",
    description: "Order questions, delivery issues, returns, and account access.",
    value: "support@marketplace.local"
  },
  {
    title: "Vendor operations",
    description: "Store setup, catalog support, onboarding, and seller workflow issues.",
    value: "vendors@marketplace.local"
  },
  {
    title: "Business enquiries",
    description: "Partnerships, marketplace builds, and platform consultation.",
    value: "business@marketplace.local"
  }
];

export async function generateMetadata() {
  const seoPage = await loadDesignedPageSeo("contact-us");
  return buildDesignedPageMetadata("Contact Us", seoPage);
}

export default function ContactUsPage() {
  return (
    <section className="container page-section stack">
      <PageIntro
        eyebrow="Contact"
        title="Reach the right team without digging through generic forms."
        description="Use the relevant channel below for support, vendor operations, or business enquiries. The goal is faster routing, clearer context, and fewer dead-end contact paths."
        actions={[
          { href: "/account", label: "Open your account" },
          { href: "/faqs", label: "Read FAQs", variant: "secondary" }
        ]}
        stats={[
          { label: "Response", value: "Business hours", caption: "Operational queries are reviewed during marketplace support hours." },
          { label: "Routing", value: "Specialized", caption: "Separate channels reduce handoff delays." }
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="glass-card p-8">
          <div className="eyebrow">Channels</div>
          <div className="mt-6 grid gap-4">
            {contactChannels.map((channel) => (
              <div key={channel.title} className="rounded-3xl border border-black/8 bg-white/70 p-5">
                <div className="mini-label">{channel.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{channel.description}</p>
                <p className="mt-4 text-base font-semibold text-ink">{channel.value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card p-8">
          <div className="eyebrow">Before You Contact Us</div>
          <div className="rich-content mt-6">
            <h2>Include order or account context</h2>
            <p>Share your order reference, account email, and the shortest clear summary of the issue so the team can respond without another round of discovery.</p>
            <h2>Use the customer account where possible</h2>
            <p>Logged-in requests are easier to verify and usually move faster because order context is already attached to your account history.</p>
            <h2>Vendor support is handled separately</h2>
            <p>Seller onboarding, listing problems, and catalog operations should go through the vendor support channel rather than general customer support.</p>
          </div>
        </article>
      </div>
    </section>
  );
}
