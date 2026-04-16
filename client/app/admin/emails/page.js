"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

export default function AdminEmailsPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to manage emails.");
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [subject, setSubject] = useState("Latest marketplace categories");
  const [previewText, setPreviewText] = useState("Explore the newest categories from the marketplace.");
  const [notice, setNotice] = useState("");

  async function load() {
    if (!token) return;
    try {
      const [subscriberResponse, campaignResponse] = await Promise.all([
        marketplaceApi.getAdminNewsletterSubscribers(token),
        marketplaceApi.getAdminNewsletterCampaigns(token)
      ]);
      setSubscribers(subscriberResponse.data || []);
      setCampaigns(campaignResponse.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  return (
    <section className="grid gap-6">
      <div>
        <div className="eyebrow">Admin</div>
        <h1 className="page-title">Email management</h1>
      </div>
      {error ? <div className="card section small">{error}</div> : null}
      {notice ? <div className="glass-card p-4 text-sm text-slate-600">{notice}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card p-5">
          <div className="eyebrow">Subscribers</div>
          <div className="mt-2 text-3xl font-semibold text-ink">{subscribers.length}</div>
          <div className="mt-4 grid gap-3">
            {subscribers.map((subscriber) => (
              <div key={subscriber._id} className="rounded-[22px] border border-black/8 bg-white/70 p-4 text-sm text-slate-600">
                <strong className="block text-ink">{subscriber.email}</strong>
                <span className="mt-1 block">Status: {subscriber.status}</span>
                <span className="mt-1 block">Source: {subscriber.source}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <form
            className="glass-card grid gap-4 p-5"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                const response = await marketplaceApi.sendLatestCategoriesNewsletter(token, { subject, previewText });
                setNotice(response.message || "Newsletter sent");
                await load();
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <div className="eyebrow">Send latest categories</div>
            <input className="field-input" value={subject} onChange={(event) => setSubject(event.target.value)} />
            <textarea className="field-input" rows={4} value={previewText} onChange={(event) => setPreviewText(event.target.value)} />
            <button className="btn-primary w-fit" type="submit">Send newsletter</button>
          </form>

          <div className="glass-card p-5">
            <div className="eyebrow">Campaign history</div>
            <div className="mt-4 grid gap-3">
              {campaigns.map((campaign) => (
                <div key={campaign._id} className="rounded-[22px] border border-black/8 bg-white/70 p-4 text-sm text-slate-600">
                  <strong className="block text-ink">{campaign.subject}</strong>
                  <span className="mt-1 block">Sent count: {campaign.sentCount}</span>
                  <span className="mt-1 block">Delivery mode: {campaign.deliveryMode}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
