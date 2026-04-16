"use client";

import { useEffect, useMemo, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const tabs = [
  { id: "all", label: "All" },
  { id: "admin", label: "Admin" },
  { id: "customers", label: "Customers" }
];

function getConversationTitle(conversation) {
  if (conversation.label === "vendor") return "Admin Support";
  return conversation.customer?.name || conversation.customer?.email || conversation.subject;
}

function getConversationMeta(conversation) {
  if (conversation.label === "vendor") return "Marketplace admin";
  return conversation.customer?.email || "Customer thread";
}

function getMessageSide(conversation, message) {
  if (!conversation) return "theirs";
  if (conversation.label === "customer") {
    return message.senderRole === "customer" ? "mine" : "theirs";
  }
  return message.senderRole === "vendor" ? "mine" : "theirs";
}

export default function VendorChatPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to access support chat.");
  const [tab, setTab] = useState("all");
  const [conversations, setConversations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState("");
  const [targetCustomerId, setTargetCustomerId] = useState("");
  const [targetType, setTargetType] = useState("admin");
  const [notice, setNotice] = useState("");

  async function loadData() {
    if (!token) return;
    try {
      const [conversationResponse, customerResponse] = await Promise.all([
        marketplaceApi.getVendorConversations(token),
        marketplaceApi.getVendorCustomers(token)
      ]);
      setConversations(conversationResponse.data || []);
      setCustomers(customerResponse.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  useEffect(() => {
    async function loadMessages() {
      if (!token || !selectedConversationId) {
        setMessages([]);
        return;
      }
      try {
        const response = await marketplaceApi.getVendorMessages(token, selectedConversationId);
        setMessages(response.data || []);
      } catch (err) {
        setError(err.message);
      }
    }

    loadMessages();
  }, [selectedConversationId, token]);

  const filteredConversations = useMemo(() => {
    if (tab === "admin") return conversations.filter((conversation) => conversation.label === "vendor");
    if (tab === "customers") return conversations.filter((conversation) => conversation.label === "customer");
    return conversations;
  }, [conversations, tab]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => String(conversation._id) === String(selectedConversationId)) || null,
    [conversations, selectedConversationId]
  );

  async function handleCreateConversation(event) {
    event.preventDefault();
    if (!token) return;
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }

    try {
      const response = await marketplaceApi.createVendorConversation(token, {
        subject: subject.trim(),
        targetRole: targetType === "customer" ? "customer" : "admin",
        participants: targetType === "customer" && targetCustomerId ? [targetCustomerId] : []
      });
      await loadData();
      setSelectedConversationId(String(response.data._id));
      setSubject("");
      setTargetCustomerId("");
      setTargetType("admin");
      setNotice("Conversation ready.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    if (!token || !selectedConversationId || !draft.trim()) return;
    try {
      await marketplaceApi.sendVendorMessage(token, selectedConversationId, { body: draft.trim() });
      const response = await marketplaceApi.getVendorMessages(token, selectedConversationId);
      setMessages(response.data || []);
      setDraft("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="container page-section stack">
      <div>
        <div className="eyebrow">Vendor</div>
        <h1 className="page-title">Support chat</h1>
        <p className="muted-copy mt-3">WhatsApp-style inbox for admin support and your own customers.</p>
      </div>

      {error ? <div className="card section small">{error}</div> : null}
      {notice ? <div className="glass-card p-4 text-sm text-slate-600">{notice}</div> : null}

      <div className="chat-shell">
        <div className="chat-layout">
          <aside className="chat-sidebar">
            <div className="chat-sidebar-head">
              <div className="eyebrow">Conversations</div>
              <div className="mt-3 flex flex-wrap gap-2">
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
              <form onSubmit={handleCreateConversation} className="mt-4 grid gap-3">
                <select value={targetType} onChange={(event) => setTargetType(event.target.value)} className="field-input">
                  <option value="admin">Admin</option>
                  <option value="customer">Customer</option>
                </select>
                {targetType === "customer" ? (
                  <select value={targetCustomerId} onChange={(event) => setTargetCustomerId(event.target.value)} className="field-input">
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>{customer.name || customer.email}</option>
                    ))}
                  </select>
                ) : null}
                <input value={subject} onChange={(event) => setSubject(event.target.value)} className="field-input" placeholder="Start new conversation" />
                <button type="submit" className="btn-primary w-full">Create</button>
              </form>
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
                  placeholder={selectedConversationId ? "Type a message" : "Select a conversation first"}
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
    </section>
  );
}
