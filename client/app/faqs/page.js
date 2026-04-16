import { PageIntro } from "@/components/storefront/PageIntro";
import { buildDesignedPageMetadata, loadDesignedPageSeo } from "@/lib/utils/designed-pages-seo";

const faqGroups = [
  {
    title: "Orders",
    items: [
      {
        question: "Can one checkout include multiple vendors?",
        answer: "Yes. The marketplace supports combined checkout while fulfillment and tracking can still be handled per vendor."
      },
      {
        question: "Why did my items arrive separately?",
        answer: "Orders can split by seller, handling window, or shipping method, so different packages may move on separate timelines."
      }
    ]
  },
  {
    title: "Returns",
    items: [
      {
        question: "Where do I request a return?",
        answer: "Return requests should be started from your order history when the item and order status are eligible."
      },
      {
        question: "When are refunds issued?",
        answer: "Refund timing depends on the review result, return confirmation, and the original payment method."
      }
    ]
  },
  {
    title: "Vendors",
    items: [
      {
        question: "How do sellers join?",
        answer: "Prospective vendors complete onboarding, submit required business details, and go through marketplace review before publishing products."
      },
      {
        question: "Can vendors manage their own catalog?",
        answer: "Yes. Vendor workflows are separated from admin controls so sellers can manage listings, inventory, and order updates inside their own dashboard."
      }
    ]
  }
];

export async function generateMetadata() {
  const seoPage = await loadDesignedPageSeo("faqs");
  return buildDesignedPageMetadata("FAQs", seoPage);
}

export default function FaqsPage() {
  return (
    <section className="container page-section stack">
      <PageIntro
        eyebrow="FAQs"
        title="Answers to the questions that come up most often in marketplace operations."
        description="This page is designed for quick scanning, so customers and vendors can find the likely answer before opening a support thread."
        actions={[
          { href: "/contact-us", label: "Contact support" },
          { href: "/products", label: "Browse products", variant: "secondary" }
        ]}
        stats={[
          { label: "Scope", value: "Customers + vendors", caption: "Answers cover both buying and selling paths." },
          { label: "Format", value: "Fast scan", caption: "Grouped for quick reading instead of long policy text." }
        ]}
      />

      <div className="grid gap-6">
        {faqGroups.map((group) => (
          <article key={group.title} className="glass-card p-8">
            <div className="eyebrow">{group.title}</div>
            <div className="mt-6 grid gap-4">
              {group.items.map((item) => (
                <div key={item.question} className="rounded-3xl border border-black/8 bg-white/70 p-6">
                  <h2 className="text-xl font-semibold text-ink">{item.question}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
