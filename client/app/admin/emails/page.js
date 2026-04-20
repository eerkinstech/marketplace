"use client";

import { useEffect, useMemo, useState } from "react";
import RichTextEditor from "@/components/admin/ProductForm/RichTextEditor";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const defaultMessage = "<p>Hello,</p><p>We have an update from MarketSphere for you.</p>";
const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const socialLinks = [
  { label: "Facebook", href: "https://facebook.com", icon: "fa-facebook-f" },
  { label: "Instagram", href: "https://instagram.com", icon: "fa-instagram" },
  { label: "X", href: "https://x.com", icon: "fa-x-twitter" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "fa-linkedin-in" }
];

function stripHtml(value = "") {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(value) {
  if (!value) return "Not sent yet";
  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

const previewContentStyles = `
  .email-preview-content h1 {
    margin: 0 0 18px;
    font-size: 30px;
    line-height: 1.18;
    font-weight: 800;
    color: #0f172a;
  }
  .email-preview-content h2 {
    margin: 0 0 16px;
    font-size: 25px;
    line-height: 1.22;
    font-weight: 800;
    color: #0f172a;
  }
  .email-preview-content h3 {
    margin: 0 0 14px;
    font-size: 21px;
    line-height: 1.28;
    font-weight: 750;
    color: #0f172a;
  }
  .email-preview-content h4 {
    margin: 0 0 12px;
    font-size: 18px;
    line-height: 1.35;
    font-weight: 750;
    color: #0f172a;
  }
  .email-preview-content h5,
  .email-preview-content h6 {
    margin: 0 0 10px;
    font-size: 15px;
    line-height: 1.4;
    font-weight: 750;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .email-preview-content p {
    margin: 0 0 14px;
    font-size: 15px;
    line-height: 1.75;
    color: #475569;
  }
  .email-preview-content ul,
  .email-preview-content ol {
    margin: 0 0 16px 22px;
    padding: 0;
    color: #475569;
  }
  .email-preview-content ul {
    list-style: disc;
  }
  .email-preview-content ol {
    list-style: decimal;
  }
  .email-preview-content li {
    margin: 0 0 8px;
    padding-left: 4px;
    font-size: 15px;
    line-height: 1.65;
  }
  .email-preview-content a {
    color: #1d5c54;
    font-weight: 700;
    text-decoration: underline;
  }
  .email-preview-content blockquote {
    margin: 0 0 16px;
    border-left: 4px solid #cbd5e1;
    padding-left: 14px;
    color: #64748b;
    font-style: italic;
  }
  .email-preview-content pre {
    margin: 0 0 16px;
    overflow-x: auto;
    border-radius: 12px;
    background: #0f172a;
    padding: 14px;
    color: #e2e8f0;
    font-size: 13px;
    line-height: 1.6;
  }
`;

export default function AdminEmailsPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage emails.");
  const [customers, setCustomers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [subject, setSubject] = useState("A message from MarketSphere");
  const [messageHtml, setMessageHtml] = useState(defaultMessage);
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);

  async function load() {
    if (!token) return;
    try {
      const [customerResponse, subscriberResponse, campaignResponse] = await Promise.all([
        marketplaceApi.getAdminCustomers(token),
        marketplaceApi.getAdminNewsletterSubscribers(token),
        marketplaceApi.getAdminNewsletterCampaigns(token)
      ]);
      setCustomers(customerResponse.data || []);
      setSubscribers(subscriberResponse.data || []);
      setCampaigns(campaignResponse.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.status === "active" && customer.email),
    [customers]
  );

  const selectedCustomers = useMemo(() => {
    const selected = new Set(selectedCustomerIds);
    return activeCustomers.filter((customer) => selected.has(String(customer._id)));
  }, [activeCustomers, selectedCustomerIds]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return activeCustomers;

    return activeCustomers.filter((customer) =>
      [customer.name, customer.email, customer.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [activeCustomers, customerSearch]);

  const allFilteredSelected = filteredCustomers.length > 0
    && filteredCustomers.every((customer) => selectedCustomerIds.includes(String(customer._id)));

  function toggleCustomer(customerId) {
    const normalizedId = String(customerId || "");
    setSelectedCustomerIds((current) =>
      current.includes(normalizedId)
        ? current.filter((id) => id !== normalizedId)
        : [...current, normalizedId]
    );
  }

  function toggleFilteredCustomers() {
    const filteredIds = filteredCustomers.map((customer) => String(customer._id));
    setSelectedCustomerIds((current) => {
      if (allFilteredSelected) {
        return current.filter((id) => !filteredIds.includes(id));
      }

      return [...new Set([...current, ...filteredIds])];
    });
  }

  async function handleSend(event) {
    event.preventDefault();
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }
    if (!stripHtml(messageHtml)) {
      setError("Message is required.");
      return;
    }
    if (!selectedCustomerIds.length) {
      setError("Select at least one customer.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setNotice("");
      const response = await marketplaceApi.sendCustomCustomerEmail(token, {
        subject: subject.trim(),
        messageHtml,
        customerIds: selectedCustomerIds
      });
      setNotice(response.message || "Customer email sent");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="grid gap-6">
      <style jsx global>{previewContentStyles}</style>
      <div className="rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eef6f3_100%)] p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="eyebrow">Admin</div>
            <h1 className="page-title">Email management</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Select customers, write a rich email message, preview the final template, and send it to their saved email addresses.
            </p>
          </div>
          <div className="flex">
            <div className="rounded-2xl border border-black/8 bg-white/80 px-4 py-3">
              <div className="text-2xl font-bold text-ink">{activeCustomers.length}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Customers</div>
            </div>
            <div className="rounded-2xl border border-black/8 bg-white/80 px-4 py-3">
              <div className="text-2xl font-bold text-ink">{selectedCustomerIds.length}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Selected</div>
            </div>
            <div className="rounded-2xl border border-black/8 bg-white/80 px-4 py-3">
              <div className="text-2xl font-bold text-ink">{campaigns.length}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Campaigns</div>
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div> : null}

      <div className="flex flex-col gap-6">
        <aside className="rounded-[28px] border border-black/8 bg-white/85 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow">Recipients</div>
              <h2 className="mt-2 text-xl font-semibold text-ink">Choose customers</h2>
            </div>
            <button
              type="button"
              onClick={toggleFilteredCustomers}
              disabled={!filteredCustomers.length}
              className="rounded-xl border border-black/8 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              {allFilteredSelected ? "Clear shown" : "Select shown"}
            </button>
          </div>

          <input
            type="search"
            value={customerSearch}
            onChange={(event) => setCustomerSearch(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1d5c54] focus:ring-2 focus:ring-[#d7ece7]"
            placeholder="Search customers..."
          />

          <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {filteredCustomers.length ? filteredCustomers.map((customer) => {
              const checked = selectedCustomerIds.includes(String(customer._id));
              return (
                <label
                  key={customer._id}
                  className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${checked
                    ? "border-[#1d5c54] bg-[#eef8f5]"
                    : "border-black/8 bg-white hover:border-[#1d5c54]/40 hover:bg-slate-50"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCustomer(customer._id)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{customer.name || "Customer"}</div>
                    <div className="mt-1 break-all text-xs text-slate-600">{customer.email}</div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Joined {formatDate(customer.createdAt)}
                    </div>
                  </div>
                </label>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-slate-500">
                No customers found.
              </div>
            )}
          </div>
        </aside>

        <form onSubmit={handleSend} className="rounded-[28px] border border-black/8 bg-white/85 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
          <div>
            <div className="eyebrow">Customer email template</div>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Compose message</h2>
          </div>

          <label className="mt-5 grid gap-2">
            <span className="text-sm font-semibold text-ink">Subject</span>
            <input
              className="field-input"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Email subject"
            />
          </label>

          <div className="mt-5">
            <RichTextEditor
              label="Message"
              value={messageHtml}
              onChange={setMessageHtml}
              placeholder="Write your customer email message..."
              rows={12}
              helperText="Use formatting, lists, headings, and links. The content appears inside the branded customer email template."
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/8 bg-slate-50 p-4">
            <div className="text-sm text-slate-600">
              Sending to <strong className="text-ink">{selectedCustomerIds.length}</strong> selected customer{selectedCustomerIds.length === 1 ? "" : "s"}.
            </div>
            <button className="btn-primary" type="submit" disabled={sending || !token || !selectedCustomerIds.length}>
              {sending ? "Sending..." : "Send email"}
            </button>
          </div>
        </form>

        <div className="grid gap-6">
          <section className="rounded-[28px] border border-black/8 bg-white/85 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="eyebrow">Preview</div>
            <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="mx-auto max-w-xl overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-ink px-6 py-5 text-white">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">MarketSphere</div>
                  <h3 className="mt-3 text-2xl font-semibold leading-tight">{subject || "Email subject"}</h3>

                </div>
                <div
                  className="email-preview-content px-6 py-6"
                  dangerouslySetInnerHTML={{ __html: messageHtml || "<p>Your message preview appears here.</p>" }}
                />

                <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 text-xs leading-5 text-slate-500">
                  <div className="px-6 pb-6 text-center">
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Visit website
                    </a>
                  </div>
                  <div className="mb-4 flex flex-wrap justify-center gap-2">
                    {socialLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={link.label}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition hover:bg-slate-800"
                      >
                        <i className={`fa-brands ${link.icon}`} />
                      </a>
                    ))}
                  </div>
                  <a href={websiteUrl} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:underline text-center block">
                    {websiteUrl}
                  </a>
                  <div className="mt-2 text-center">You are receiving this message because you have a customer account with MarketSphere.</div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-black/8 bg-white/85 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="eyebrow">Selected recipients</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedCustomers.length ? selectedCustomers.map((customer) => (
                <span key={customer._id} className="rounded-full bg-[#eef8f5] px-3 py-1 text-xs font-semibold text-[#1d5c54] ring-1 ring-[#cbe8df]">
                  {customer.email}
                </span>
              )) : (
                <span className="text-sm text-slate-500">No customers selected.</span>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-black/8 bg-white/85 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="eyebrow">Campaign history</div>
            <div className="mt-4 grid max-h-[360px] gap-3 overflow-y-auto pr-1">
              {campaigns.length ? campaigns.map((campaign) => (
                <div key={campaign._id} className="rounded-2xl border border-black/8 bg-white p-4 text-sm text-slate-600">
                  <strong className="block text-ink">{campaign.subject}</strong>
                  <span className="mt-1 block">Sent count: {campaign.sentCount}</span>
                  <span className="mt-1 block">Audience: {campaign.audience || "subscribers"}</span>
                  <span className="mt-1 block">Mode: {campaign.deliveryMode}</span>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-slate-500">
                  No campaigns yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
