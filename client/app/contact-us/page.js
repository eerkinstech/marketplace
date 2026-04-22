import { ContactUsClient } from "@/components/storefront/ContactUsClient";
import { buildDesignedPageMetadata, loadDesignedPageSeo } from "@/lib/utils/designed-pages-seo";

export async function generateMetadata() {
  const seoPage = await loadDesignedPageSeo("contact-us");
  return buildDesignedPageMetadata("Contact Us", seoPage, "/contact-us");
}

export default function ContactUsPage() {
  return <ContactUsClient />;
}
