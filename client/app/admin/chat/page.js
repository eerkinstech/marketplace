"use client";

import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const tabs = [
  { id: "all", label: "All" },
  { id: "vendor", label: "Vendors" },
  { id: "customer", label: "Customers" },
  { id: "newsletters", label: "Newsletters" },
  { id: "contact_form", label: "Contact Form" }
];

function getConversationTitle(conversation) {
  if (conversation.label === "vendor") return conversation.vendor?.storeName || conversation.vendor?.name || "Vendor";
  if (conversation.label === "customer") return conversation.customer?.name || conversation.customer?.email || "Customer";
  return conversation.contactName || conversation.contactEmail || conversation.subject;
}

function getConversationMeta(conversation) {
  if (conversation.label === "vendor") return conversation.vendor?.email || "Vendor support";
  if (conversation.label === "customer") return conversation.customer?.email || "Customer support";
  return conversation.contactEmail || "Contact form";
}

function getMessageSide(conversation, message) {
  if (!conversation) return "theirs";
  if (conversation.label === "contact_form") {
    return message.senderRole === "admin" ? "theirs" : "mine";
  }
  if (conversation.label === "customer") {
    return message.senderRole === "customer" ? "mine" : "theirs";
  }
  return message.senderRole === "vendor" ? "mine" : "theirs";
}

export default function AdminChatPage() {
  const { token, error, setError } = useAccessToken("Login with an admin account to access support chat.");
  const [tab, setTab] = useState("all");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [draft, setDraft] = useState("");
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [newsletterSubject, setNewsletterSubject] = useState("Latest marketplace categories");
  const [newsletterPreview, setNewsletterPreview] = useState("Explore the newest categories from the marketplace.");
  const [notice, setNotice] = useState("");

  async function loadInbox() {
    if (!token) return;
    try {
      const [conversationResponse, subscriberResponse, campaignResponse, contactResponse] = await Promise.all([
        marketplaceApi.getAdminConversations(token),
        marketplaceApi.getAdminNewsletterSubscribers(token),
        marketplaceApi.getAdminNewsletterCampaigns(token),
        marketplaceApi.getAdminContactSubmissions(token)
      ]);
      setConversations(conversationResponse.data || []);
      setSubscribers(subscriberResponse.data || []);
      setCampaigns(campaignResponse.data || []);
      setContacts(contactResponse.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadInbox();
  }, [token]);

  useEffect(() => {
    async function loadMessages() {
      if (!token || !selectedConversationId) {
        setMessages([]);
        return;
      }
      try {
        const response = await marketplaceApi.getAdminMessages(token, selectedConversationId);
        setMessages(response.data || []);
      } catch (err) {
        setError(err.message);
      }
    }

    loadMessages();
  }, [selectedConversationId, token]);

  const filteredConversations = useMemo(() => {
    if (tab === "all") return conversations;
    if (tab === "vendor") return conversations.filter((conversation) => conversation.label === "vendor");
    if (tab === "customer") return conversations.filter((conversation) => conversation.label === "customer");
    if (tab === "contact_form") return conversations.filter((conversation) => conversation.label === "contact_form");
    return [];
  }, [conversations, tab]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => String(conversation._id) === String(selectedConversationId)) || null,
    [conversations, selectedConversationId]
  );

  async function handleSendMessage(event) {
    event.preventDefault();
    if (!token || !selectedConversationId || !draft.trim()) return;
    try {
      await marketplaceApi.sendAdminMessage(token, selectedConversationId, { body: draft.trim() });
      const response = await marketplaceApi.getAdminMessages(token, selectedConversationId);
      setMessages(response.data || []);
      setDraft("");
      await loadInbox();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSendNewsletter(event) {
    event.preventDefault();
    if (!token) return;
    try {
      const response = await marketplaceApi.sendLatestCategoriesNewsletter(token, {
        subject: newsletterSubject,
        previewText: newsletterPreview
      });
      setNotice(response.message);
      await loadInbox();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="container page-section stack">
      <div>
        <div className="eyebrow">Admin</div>
        <h1 className="page-title">Inbox and support</h1>
        <p className="muted-copy mt-3">Messenger-style inbox for vendor support, customer support, newsletters, and contact forms.</p>
      </div>

      {error ? <div className="card section small">{error}</div> : null}
      {notice ? <div className="glass-card p-4 text-sm text-slate-600">{notice}</div> : null}

      {tab === "newsletters" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === entry.id ? "bg-ink text-white" : "bg-white/70 text-slate-600"}`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
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
              <form onSubmit={handleSendNewsletter} className="glass-card grid gap-4 p-5">
                <div className="eyebrow">Send latest categories email</div>
                <input value={newsletterSubject} onChange={(event) => setNewsletterSubject(event.target.value)} className="field-input" placeholder="Email subject" />
                <textarea value={newsletterPreview} onChange={(event) => setNewsletterPreview(event.target.value)} rows={4} className="field-input" placeholder="Preview text" />
                <button type="submit" className="btn-primary w-fit">Send newsletter</button>
              </form>

              <div className="glass-card p-5">
                <div className="eyebrow">Campaign history</div>
                <div className="mt-4 grid gap-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign._id} className="rounded-[22px] border border-black/8 bg-white/70 p-4 text-sm text-slate-600">
                      <strong className="block text-ink">{campaign.subject}</strong>
                      <span className="mt-1 block">Sent: {campaign.sentCount}</span>
                      <span className="mt-1 block">Mode: {campaign.deliveryMode}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : tab === "contact_form" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === entry.id ? "bg-ink text-white" : "bg-white/70 text-slate-600"}`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="glass-card p-5">
            <div className="eyebrow">Contact submissions</div>
            <div className="mt-4 grid gap-3">
              {contacts.map((contact) => (
                <div key={contact._id} className="rounded-[22px] border border-black/8 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-ink">{contact.subject}</strong>
                    <span className="badge">{contact.status}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{contact.name} • {contact.email}</div>
                  {contact.vendor?.storeName ? <div className="mt-1 text-sm text-slate-600">Vendor: {contact.vendor.storeName}</div> : null}
                  <p className="mt-3 text-sm text-slate-700">{contact.message}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === entry.id ? "bg-ink text-white" : "bg-white/70 text-slate-600"}`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="chat-shell">
            <div className="chat-layout">
              <aside className="chat-sidebar">
                <div className="chat-sidebar-head">
                  <div className="eyebrow">Conversations</div>
                  <div className="mt-2 text-sm text-slate-600">{filteredConversations.length} threads</div>
                </div>
                <div className="chat-sidebar-list">
                  {filteredConversations.length ? filteredConversations.map((conversation) => (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() => setSelectedConversationId(String(conversation._id))}
                      className={`chat-thread-button ${String(selectedConversationId) === String(conversation._id) ? "active" : "inactive"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <strong className="block truncate text-sm text-ink">{getConversationTitle(conversation)}</strong>
                          <span className="mt-1 block text-xs text-slate-500">{getConversationMeta(conversation)}</span>
                        </div>
                        <span className="badge">{conversation.label}</span>
                      </div>
                      <div className="mt-3 line-clamp-1 text-sm text-slate-600">{conversation.lastMessagePreview || conversation.subject}</div>
                    </button>
                  )) : (
                    <div className="chat-empty">No conversations in this tab yet.</div>
                  )}
                </div>
              </aside>

              <div className="chat-main">
                <div className="chat-main-head">
                  <div>
                    <div className="eyebrow">Chat</div>
                    <h2 className="mt-1 text-2xl font-semibold text-ink">
                      {selectedConversation ? getConversationTitle(selectedConversation) : "Select a conversation"}
                    </h2>
                    <div className="mt-1 text-sm text-slate-500">
                      {selectedConversation ? selectedConversation.subject : "Choose a thread from the left panel"}
                    </div>
                  </div>
                  {selectedConversation ? <span className="badge">{selectedConversation.label}</span> : null}
                </div>

                <div className="chat-scroll">
                  {messages.length ? messages.map((message) => (
                    <div
                      key={message._id}
                      className={`chat-bubble ${getMessageSide(selectedConversation, message)}`}
                    >
                      <div className="mb-1 text-[11px] uppercase tracking-[0.18em] opacity-70">{message.senderName}</div>
                      <div>{message.body}</div>
                    </div>
                  )) : (
                    <div className="chat-empty">
                      {selectedConversationId ? "No messages yet." : "Select a conversation to view messages."}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="chat-composer">
                  <div className="chat-composer-row">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={2}
                      className="field-input"
                      placeholder={selectedConversationId ? "Type your reply" : "Select a conversation first"}
                      disabled={!selectedConversationId}
                    />
                    <button className="btn-primary" type="submit" disabled={!selectedConversationId || !draft.trim()}>
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
