import { FaqsClient } from "@/components/storefront/FaqsClient";
import { buildDesignedPageMetadata, loadDesignedPageSeo } from "@/lib/utils/designed-pages-seo";

export async function generateMetadata() {
  const seoPage = await loadDesignedPageSeo("faqs");
  return buildDesignedPageMetadata("FAQs", seoPage, "/faqs");
}

export default function FaqsPage() {
  return <FaqsClient />;
}
