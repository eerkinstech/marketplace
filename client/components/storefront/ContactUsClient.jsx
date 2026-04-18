"use client";

import { useState } from "react";
import Link from "next/link";
import { marketplaceApi } from "@/lib/api/marketplace";
import { tokenStore } from "@/lib/auth/token-store";

const contactChannels = [
  {
    title: "Customer support",
    description: "Order questions, delivery issues, returns, and account access.",
    value: "support@marketplace.local"
  },
];

const quickLinks = [
  { href: "/support", label: "Support Center" },
  { href: "/faqs", label: "FAQs" },
  { href: "/returns", label: "Returns" },
  { href: "/account", label: "My Account" }
];



export function ContactUsClient() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");
    setError("");

    try {
      const token = tokenStore.get();
      await marketplaceApi.submitContact(form, token || "");
      setForm({ name: "", email: "", subject: "", message: "" });
      setNotice("Your message has been sent. The team will review it shortly.");
    } catch (submissionError) {
      setError(submissionError.message || "Unable to send your message right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container page-section stack">
      <div
        className="overflow-hidden rounded-[36px] border border-black/8 px-6 py-8 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10 lg:py-10"
        style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--white) 96%, transparent) 0%, color-mix(in srgb, var(--secondary) 18%, var(--white)) 48%, color-mix(in srgb, var(--accent) 10%, var(--white)) 100%)" }}
      >
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="eyebrow">Contact us</div>
            <h1 className="mt-3 max-w-4xl font-medium text-4xl font-black tracking-[-0.04em] text-ink sm:text-5xl">
              Reach the right team with a clearer contact flow.
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Use the contact form for direct marketplace enquiries, or choose the right channel below for support, vendor operations, and business discussion. The page is structured to reduce dead ends and speed up routing.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[24px] border border-black/8 bg-white/75 px-5 py-4 text-sm font-semibold text-ink transition hover:bg-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="glass-card p-8">
          <div className="eyebrow">Send a message</div>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ink">Contact form</h2>
       

          {notice ? (
            <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          ) : null}
          {error ? (
            <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="field-input bg-white"
                placeholder="Your name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
              <input
                className="field-input bg-white"
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </div>
            <input
              className="field-input bg-white"
              placeholder="Subject"
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              required
            />
            <textarea
              className="field-input bg-white"
              rows={7}
              placeholder="How can we help?"
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              required
            />
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send message"}
              </button>
              <Link href="/support" className="btn-secondary">
                Open support center
              </Link>
            </div>
          </form>
        </article>

        <div className="grid gap-6">
          <article className="glass-card p-8">
            <div className="eyebrow">Contact details</div>
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
            <div className="eyebrow">Quick links</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[22px] border border-black/8 bg-white/75 px-4 py-4 text-sm font-semibold text-ink transition hover:bg-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
