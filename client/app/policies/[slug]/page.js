import { notFound } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace";
import { cleanMetaDescription, cleanPageTitle } from "@/lib/utils/metadata";

async function loadPolicy(slug) {
  const response = await marketplaceApi.safeGetPolicyBySlug(slug);
  return response?.data || null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const policy = await loadPolicy(slug);

  if (!policy) {
    return {
      title: "Policy Not Found"
    };
  }

  const title = cleanPageTitle(policy?.seo?.metaTitle, policy.title);
  const description = cleanMetaDescription(policy?.seo?.metaDescription);

  return {
    title,
    description,
    alternates: {
      canonical: `/policies/${policy.slug}`
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/policies/${policy.slug}`
    }
  };
}

export default async function PolicyPage({ params }) {
  const { slug } = await params;
  const policy = await loadPolicy(slug);

  if (!policy) {
    notFound();
  }

  return (
    <section className="container page-section">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-black/8 bg-white/85 p-8 shadow-[0_18px_48px_rgba(16,32,26,0.08)] sm:p-10">
        <div className="eyebrow">Policy</div>
        <h1 className="page-title mt-3">{policy.title}</h1>
        <div
          className="rich-content mt-8"
          dangerouslySetInnerHTML={{ __html: policy.content || "<p>No content available.</p>" }}
        />
      </div>
    </section>
  );
}
