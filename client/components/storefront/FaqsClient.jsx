"use client";

import { useState } from "react";
import Link from "next/link";

const faqGroups = [
  {
    title: "Orders",
    description: "Questions about checkout, delivery timing, and order flow.",
    items: [
      {
        question: "Can one checkout include multiple vendors?",
        answer: "Yes. The marketplace supports combined checkout while fulfillment and tracking can still be handled per vendor."
      },
      {
        question: "Why did my items arrive separately?",
        answer: "Orders can split by seller, handling window, or shipping method, so different packages may move on separate timelines."
      },
      {
        question: "Can I track each item after checkout?",
        answer: "Yes. Orders can include multiple shipments, and tracking visibility is usually shown per fulfilled package when the seller updates dispatch details."
      },
      {
        question: "Can I cancel an order after placing it?",
        answer: "Cancellation depends on the order stage. If fulfillment has not started yet, support or the seller may still be able to stop the order."
      }
    ]
  },
  {
    title: "Returns",
    description: "Common return, refund, and eligibility questions.",
    items: [
      {
        question: "Where do I request a return?",
        answer: "Return requests should be started from your order history when the item and order status are eligible."
      },
      {
        question: "When are refunds issued?",
        answer: "Refund timing depends on the review result, return confirmation, and the original payment method."
      },
      {
        question: "Do all products support returns?",
        answer: "Return eligibility depends on the item, seller policy, order status, and whether the return request falls inside the approved return window."
      },
      {
        question: "What should I include in a return request?",
        answer: "Include the order reference, product details, the reason for return, and any helpful proof such as photos when the issue is product-related."
      }
    ]
  },
  {
    title: "Vendors",
    description: "Joining, onboarding, and seller workflow guidance.",
    items: [
      {
        question: "How do sellers join?",
        answer: "Prospective vendors complete onboarding, submit required business details, and go through marketplace review before publishing products."
      },
      {
        question: "Can vendors manage their own catalog?",
        answer: "Yes. Vendor workflows are separated from admin controls so sellers can manage listings, inventory, and order updates inside their own dashboard."
      },
      {
        question: "Do products go live immediately after creation?",
        answer: "Not always. Marketplace approval flows may require review before a new or updated product becomes visible on the storefront."
      },
      {
        question: "Can vendors update pricing and stock later?",
        answer: "Yes. Vendors can maintain their listings over time, including price, stock, media, and product details, depending on role permissions."
      }
    ]
  },
  {
    title: "Payments",
    description: "Billing, payment flow, and checkout-related guidance.",
    items: [
      {
        question: "Which payment methods can customers use?",
        answer: "Available payment methods depend on the marketplace setup and region, but the checkout flow is designed to show only the supported options at the time of purchase."
      },
      {
        question: "Why did my payment not go through?",
        answer: "A payment can fail because of issuer checks, invalid details, insufficient funds, security flags, or temporary payment provider issues."
      },
      {
        question: "Will I get an order confirmation after payment?",
        answer: "Yes. Once the order is accepted successfully, the marketplace should show confirmation details and attach the order to your account history."
      }
    ]
  },
  {
    title: "Accounts",
    description: "Profile, login, and account support topics.",
    items: [
      {
        question: "Do I need an account to place an order?",
        answer: "Marketplace configuration may allow guest-like flows in some cases, but using an account makes it easier to manage orders, returns, and contact history."
      },
      {
        question: "Where can I see my order history?",
        answer: "Your account area is the main place to review orders, track progress, and access eligible return or support actions."
      },
      {
        question: "What should I do if I cannot access my account?",
        answer: "Start with the login and account recovery flow. If access problems continue, contact support with your account email and a short description of the issue."
      }
    ]
  }
];

function PlusIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className={`h-5 w-5 transition duration-300 ${open ? "rotate-45" : "rotate-0"}`}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function FaqsClient() {
  const [openItem, setOpenItem] = useState("Orders-0");

  return (
    <section className="shell-container page-section stack">
      <div
        className="overflow-hidden rounded-[36px] border border-black/8 px-6 py-8 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10 lg:py-10"
        style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--white) 96%, transparent) 0%, color-mix(in srgb, var(--secondary) 18%, var(--white)) 48%, color-mix(in srgb, var(--accent) 10%, var(--white)) 100%)" }}
      >
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="eyebrow">Frequently asked questions</div>
            <h1 className="mt-3 max-w-4xl text-4xl font-medium font-black tracking-[-0.04em] text-ink sm:text-5xl">
              Clear answers for common marketplace questions.
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              This page is designed for quick scanning, so customers and vendors can get to the likely answer faster before opening a support request.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/contact-us" className="rounded-[24px] border border-black/8 bg-white/75 px-5 py-4 text-sm font-semibold text-ink transition hover:bg-white">
              Contact us
            </Link>
            <Link href="/support" className="rounded-[24px] border border-black/8 bg-white/75 px-5 py-4 text-sm font-semibold text-ink transition hover:bg-white">
              Support center
            </Link>
            <Link href="/returns" className="rounded-[24px] border border-black/8 bg-white/75 px-5 py-4 text-sm font-semibold text-ink transition hover:bg-white">
              Returns
            </Link>
            <Link href="/account" className="rounded-[24px] border border-black/8 bg-white/75 px-5 py-4 text-sm font-semibold text-ink transition hover:bg-white">
              My account
            </Link>
          </div>
        </div>
      </div>

      <div className="">


        <div className="grid gap-6">
          {faqGroups.map((group) => (
            <article key={group.title} className="glass-card p-8">
              <div className="eyebrow">{group.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">{group.description}</div>
              <div className="mt-6 grid gap-4">
                {group.items.map((item, index) => {
                  const itemKey = `${group.title}-${index}`;
                  const isOpen = openItem === itemKey;

                  return (
                    <div key={item.question} className="overflow-hidden rounded-3xl border border-black/8 bg-white/75">
                      <button
                        type="button"
                        onClick={() => setOpenItem((current) => current === itemKey ? "" : itemKey)}
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                      >
                        <h3 className="text-lg font-semibold leading-7 text-ink">{item.question}</h3>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/8 bg-white text-slate-700">
                          <PlusIcon open={isOpen} />
                        </span>
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                      >
                        <div className="overflow-hidden">
                          <div className="border-t border-black/8 px-6 py-5 text-sm leading-7 text-slate-600">
                            {item.answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
