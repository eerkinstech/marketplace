"use client";

import { useMemo, useState } from "react";
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

export function ProductDetailTabs({ product }) {
  const [activeTab, setActiveTab] = useState("description");
  const reviews = Array.isArray(product?.reviews) ? product.reviews.filter((review) => review && (review.status === "approved" || review.isApproved === true)) : [];
  const reviewCount = Number(product?.numReviews || product?.reviewCount || product?.ratingCount || reviews.length || 0);
  const benefits = useMemo(() => extractBenefits(product), [product]);

  const tabs = [
    { id: "description", label: "Description", count: null },
    { id: "benefits", label: "Benefits", count: benefits.length > 0 ? benefits.length : null },
    { id: "reviews", label: "Reviews", count: reviewCount },
  ];

  return (
    <section className="rounded-[28px] border border-black/8 bg-white shadow-[0_16px_40px_rgba(16,32,26,0.06)] backdrop-blur-sm">
      {/* Tab Navigation */}
      <div className="relative grid grid-cols-3 sm:grid-cols-5 border-b border-black/8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
            className={`
              relative z-10 flex min-h-[68px] items-center justify-center gap-2 px-4 py-4 text-sm font-semibold
              transition-all duration-300 ease-out
              ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-slate-600 hover:bg-gradient-to-b hover:from-[color-mix(in_srgb,var(--background)_72%,var(--white))] hover:to-transparent hover:text-slate-900"
              }
            `}
          >
            {/* Active tab background - positioned absolutely */}
            {activeTab === tab.id && (
              <span className="absolute inset-0 rounded-t-[28px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 72%, var(--white)) 0%, color-mix(in srgb, var(--accent) 78%, var(--black)) 100%)" }} />
            )}
            
            {/* Tab content */}
            <span className="relative flex items-center gap-2">
              {tab.label}
              {tab.count !== null && (
                <span
                  className={`
                    min-w-[24px] rounded-full px-2 py-0.5 text-xs font-bold tabular-nums
                    transition-colors duration-300
                    ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </span>

            {/* Bottom indicator for active tab */}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-1/2 h-[3px] w-16 -translate-x-1/2 rounded-full bg-white shadow-[0_2px_8px_rgba(255,255,255,0.4)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content with fade animation */}
      <div className="p-6 sm:p-10">
        <div
          key={activeTab}
          className="animate-[fadeIn_0.4s_ease-out]"
        >
          {activeTab === "description" && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  Product Details
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              </div>
              <div
                className="rich-content"
                dangerouslySetInnerHTML={{ __html: product?.description || "<p>No description available.</p>" }}
              />
            </div>
          )}

          {activeTab === "benefits" && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  Key Benefits
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              </div>
              {benefits.length ? (
                <div className="grid gap-3">
                  {benefits.map((benefit, index) => (
                    <div
                      key={`${benefit}-${index}`}
                      className="group relative overflow-hidden rounded-[18px] border border-black/6 px-5 py-4 shadow-sm transition-all duration-300 hover:shadow-md"
                      style={{
                        background: "linear-gradient(135deg, color-mix(in srgb, var(--white) 84%, var(--background)) 0%, color-mix(in srgb, var(--background) 88%, var(--secondary)) 100%)",
                        borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                        animationDelay: `${index * 50}ms`,
                        animation: "slideInUp 0.5s ease-out both",
                      }}
                    >
                      {/* Decorative accent */}
                      <div className="absolute left-0 top-0 h-full w-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 72%, var(--white)) 100%)" }} />
                      
                      {/* Icon */}
                      <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)" }}>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      
                      <div className="pl-1 text-sm leading-relaxed text-slate-700">
                        {benefit}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500">No additional benefit content has been added yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && <ProductReviews product={product} />}
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
