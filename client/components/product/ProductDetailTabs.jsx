"use client";

import { useMemo } from "react";
import { ProductReviews } from "@/components/product/ProductReviews";

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractBenefits(product) {
  const html = product?.benefitsText || product?.benefits || "";
  if (!html) return [];

  if (Array.isArray(html)) {
    return html.map((item) => stripHtml(item)).filter(Boolean);
  }

  const items = String(html)
    .split(/<\/li>|<br\s*\/?>/i)
    .map((item) => stripHtml(item))
    .filter(Boolean);

  if (items.length > 1) return items;

  const plain = stripHtml(html);
  return plain ? [plain] : [];
}

function parseBenefitFields(product) {
  const html = String(product?.benefitsText || product?.benefits || "").trim();
  if (html) {
    const paragraphMatches = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gis)];
    if (paragraphMatches.length) {
      return paragraphMatches.map((match, index) => {
        const paragraph = match[1] || "";
        const strongMatch = paragraph.match(/<strong[^>]*>(.*?)<\/strong>\s*[:\-]?\s*(.*)/is);

        if (strongMatch) {
          return {
            id: `benefit-${index}`,
            heading: stripHtml(strongMatch[1]) || `Detail ${index + 1}`,
            text: stripHtml(strongMatch[2])
          };
        }

        const text = stripHtml(paragraph);
        const splitMatch = text.match(/^([^:.-]{2,40})\s*[:\-]\s*(.+)$/);
        if (splitMatch) {
          return {
            id: `benefit-${index}`,
            heading: splitMatch[1].trim(),
            text: splitMatch[2].trim()
          };
        }

        return {
          id: `benefit-${index}`,
          heading: `Detail ${index + 1}`,
          text
        };
      }).filter((item) => item.text);
    }
  }

  const fallbackBenefits = extractBenefits(product);
  return fallbackBenefits.map((benefit, index) => {
    const text = stripHtml(benefit);
    const match = text.match(/^([^:.-]{2,40})\s*[:\-]\s*(.+)$/);
    if (match) {
      return {
        id: `${match[1]}-${index}`,
        heading: match[1].trim(),
        text: match[2].trim()
      };
    }

    return {
      id: `benefit-${index}`,
      heading: `Detail ${index + 1}`,
      text
    };
  }).filter((item) => item.text);
}

function buildItemSpecificFields(product, benefitFields) {
  return benefitFields;
}

export function ProductDetailTabs({ product }) {
  const reviews = Array.isArray(product?.reviews) ? product.reviews.filter((review) => review && (review.status === "approved" || review.isApproved === true)) : [];
  const reviewCount = Number(product?.numReviews || product?.reviewCount || product?.ratingCount || reviews.length || 0);
  const benefitFields = useMemo(() => parseBenefitFields(product), [product]);
  const itemSpecificFields = useMemo(() => buildItemSpecificFields(product, benefitFields), [benefitFields, product]);

  return (
    <section className="rounded-[28px] border border-black/8 bg-white shadow-[0_16px_40px_rgba(16,32,26,0.06)] backdrop-blur-sm">
      <div className="p-6 sm:p-10">
        <div className="animate-[fadeIn_0.4s_ease-out] space-y-12">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">About this item</div>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            {itemSpecificFields.length ? (
              <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5 sm:px-6">
                <h3 className="text-[1.85rem] font-black tracking-[-0.03em] text-ink">Item specifics</h3>
                <div className="mt-6 grid gap-10 lg:grid-cols-2">
                  {[0, 1].map((columnIndex) => {
                    const columnItems = itemSpecificFields.filter((_, index) => index % 2 === columnIndex);
                    if (!columnItems.length) return null;

                    return (
                      <div key={`column-${columnIndex}`} className="grid">
                        {columnItems.map((benefit, index) => (
                          <div
                            key={benefit.id || `${benefit.heading}-${index}`}
                            className={`grid gap-2 py-3 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-5 ${index !== columnItems.length - 1 ? "border-b border-black/8" : ""}`}
                            style={{
                              animationDelay: `${(columnIndex + index) * 40}ms`,
                              animation: "slideInUp 0.45s ease-out both",
                            }}
                          >
                            <div className="text-[15px] font-medium text-slate-500 sm:text-base">
                              {benefit.heading}
                            </div>
                            <div className="text-[15px] font-semibold leading-7 text-ink sm:text-base">
                              {benefit.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">No item details have been added yet.</p>
              </div>
            )}
          </div>

          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <div className="text-center text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Description
              </div>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: product?.description || "<p>No description available.</p>" }}
            />
          </div>

          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                <span>Reviews</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{reviewCount}</span>
              </div>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <ProductReviews product={product} />
          </div>
        </div>
      </div>

      {/* Inline CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
