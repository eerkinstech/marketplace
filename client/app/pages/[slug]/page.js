import { notFound } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace";
import { cleanMetaDescription, cleanPageTitle } from "@/lib/utils/metadata";

// Reserved slugs that should not be handled by this dynamic route
const reservedSlugs = ["about-us", "faqs", "contact-us"];

async function loadPage(slug) {
  // Don't fetch reserved pages - they have their own routes
  if (reservedSlugs.includes(slug)) {
    return null;
  }

  const response = await marketplaceApi.safeGetPageBySlug(slug);
  return response?.data || null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await loadPage(slug);

  if (!page) {
    return {
      title: "Page Not Found"
    };
  }

  const title = cleanPageTitle(page?.seo?.metaTitle, page.title);
  const description = cleanMetaDescription(page?.seo?.metaDescription);

  return {
    title,
    description,
    alternates: {
      canonical: `/pages/${page.slug}`
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/pages/${page.slug}`
    }
  };
}

export default async function PublicPage({ params }) {
  const { slug } = await params;
  const page = await loadPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <section className="container page-section">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-black/8 bg-white/85 p-8 shadow-[0_18px_48px_rgba(16,32,26,0.08)] sm:p-10">
        <div className="eyebrow">Page</div>
        <h1 className="page-title mt-3 font-bold">{page.title}</h1>
        <div
          className="rich-content mt-8"
          dangerouslySetInnerHTML={{ __html: page.content || "<p>No content available.</p>" }}
        />
      </div>
    </section>
  );
}
