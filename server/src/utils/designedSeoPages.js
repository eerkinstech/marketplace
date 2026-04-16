import { SeoPage } from "../models/SeoPage.js";

export const DESIGNED_SEO_PAGES = [
  {
    key: "about-us",
    title: "About Us",
    path: "/about-us",
    metaTitle: "About Us | MarketSphere",
    metaDescription: "Learn how MarketSphere structures multi-vendor commerce with cleaner storefront design and stronger operations."
  },
  {
    key: "contact-us",
    title: "Contact Us",
    path: "/contact-us",
    metaTitle: "Contact Us | MarketSphere",
    metaDescription: "Contact MarketSphere for customer support, vendor operations, and business enquiries."
  },
  {
    key: "faqs",
    title: "FAQs",
    path: "/faqs",
    metaTitle: "FAQs | MarketSphere",
    metaDescription: "Common questions about orders, returns, vendors, and marketplace workflows."
  }
];

export const DESIGNED_SEO_PAGE_KEYS = DESIGNED_SEO_PAGES.map((page) => page.key);

export async function ensureDesignedSeoPages() {
  await Promise.all(
    DESIGNED_SEO_PAGES.map((page) =>
      SeoPage.updateOne(
        { key: page.key },
        { $setOnInsert: page },
        { upsert: true }
      )
    )
  );
}
