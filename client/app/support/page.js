"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import { tokenStore } from "@/lib/auth/token-store";
import { marketplaceApi } from "@/lib/api/marketplace";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

function decodeToken(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
}

function getParticipantId(participant) {
  if (!participant) return "";
  return typeof participant === "string" ? participant : participant._id;
}

function getConversationVendorId(conversation) {
  if (!conversation) return "";
  if (conversation.vendor) {
    return typeof conversation.vendor === "string" ? conversation.vendor : conversation.vendor._id;
  }
  const vendorParticipant = (conversation.participants || []).find((participant) => {
    if (!participant || typeof participant === "string") return false;
    return participant.role === "vendor";
  });
  return getParticipantId(vendorParticipant);
}

function getMessageSide(conversation, message, userId) {
  if (!conversation) return "theirs";
  if (conversation.label === "contact_form") {
    return message.senderRole === "admin" ? "mine" : "theirs";
  }
  return String(message.sender) === String(userId) ? "mine" : "theirs";
}

export default function SupportPage() {
  const socketRef = useRef(null);
  const [preferredVendorSlug, setPreferredVendorSlug] = useState("");
  const [socketState, setSocketState] = useState("Disconnected");
  const [vendors, setVendors] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [userId, setUserId] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPreferredVendorSlug(params.get("vendor") || "");
  }, []);

  useEffect(() => {
    let active = true;

    async function loadStores() {
      const response = await marketplaceApi.getStores();
      if (active) setVendors(response.data || []);
    }

    loadStores().catch(() => {
      if (active) setNotice("Unable to load vendor stores right now.");
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    const payload = decodeToken(token);
    setUserId(payload?.sub || "");

    marketplaceApi.getConversations(token)
      .then((response) => setConversations(response.data || []))
      .catch(() => setNotice("Unable to load your support conversations."));

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => setSocketState("Connected"));
    socket.on("disconnect", () => setSocketState("Disconnected"));
    socket.on("message:new", (message) => {
      setConversations((current) => current.map((conversation) => (
        String(conversation._id) === String(message.conversation)
          ? { ...conversation, lastMessageAt: message.createdAt, lastMessagePreview: message.body }
          : conversation
      )));
      if (String(message.conversation) === String(selectedConversationId)) {
        setMessages((current) => [...current, message]);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedConversationId]);

  useEffect(() => {
    if (!preferredVendorSlug || !vendors.length) return;
    const vendor = vendors.find((entry) => entry.storeSlug === preferredVendorSlug);
    if (vendor) setSelectedVendorId(String(vendor._id));
  }, [preferredVendorSlug, vendors]);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token || !selectedConversationId) {
      setMessages([]);
      return;
    }

    marketplaceApi.getMessages(token, selectedConversationId)
      .then((response) => {
        setMessages(response.data || []);
        socketRef.current?.emit("conversation:join", selectedConversationId);
      })
      .catch(() => setNotice("Unable to load messages for this conversation."));
  }, [selectedConversationId]);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => String(vendor._id) === String(selectedVendorId)) || null,
    [selectedVendorId, vendors]
  );

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => String(conversation._id) === String(selectedConversationId)) || null,
    [conversations, selectedConversationId]
  );

  async function startSupport(vendor) {
    const token = tokenStore.get();
    if (!token) {
      setNotice("Login as a customer to open vendor support.");
      return;
    }

    const existing = conversations.find((conversation) =>
      (conversation.participants || []).some((participant) => String(getParticipantId(participant)) === String(vendor._id))
    );

    if (existing) {
      setSelectedConversationId(String(existing._id));
      setSelectedVendorId(String(vendor._id));
      setNotice(`Opened existing support thread for ${vendor.storeName}.`);
      return;
    }

    const response = await marketplaceApi.createConversation(token, {
      participants: [String(vendor._id)],
      subject: `Support request for ${vendor.storeName}`
    });

    const conversation = response.data;
    setConversations((current) => [conversation, ...current]);
    setSelectedConversationId(String(conversation._id));
    setSelectedVendorId(String(vendor._id));
    setNotice(`Support thread created for ${vendor.storeName}.`);
  }

  function sendMessage(event) {
    event.preventDefault();
    if (!draft.trim() || !selectedConversationId) return;

    socketRef.current?.emit("message:send", {
      conversationId: selectedConversationId,
      body: draft.trim(),
      attachments: []
    });
    setDraft("");
  }

  async function refreshConversations(token, nextConversationId = "") {
    try {
      const response = await marketplaceApi.getConversations(token);
      const nextConversations = response.data || [];
      setConversations(nextConversations);

      if (nextConversationId) {
        const nextConversation = nextConversations.find(
          (conversation) => String(conversation._id) === String(nextConversationId)
        );
        if (nextConversation) {
          setSelectedConversationId(String(nextConversation._id));
          const vendorId = getConversationVendorId(nextConversation);
          if (vendorId) setSelectedVendorId(String(vendorId));
        }
      }
    } catch {
      setNotice("Unable to load your support conversations.");
    }
  }

  return (
    <section className="container page-section stack">
      <div>
        <div className="eyebrow">Support</div>
        <h1 className="page-title">Vendor chat</h1>
        <p className="muted-copy mt-3">Messenger-style support view for customers to talk directly with vendor stores.</p>
      </div>

      {notice ? <div className="glass-card p-4 text-sm text-slate-600">{notice}</div> : null}

      <div className="chat-shell">
        <div className="chat-layout">
          <aside className="chat-sidebar">
            <div className="chat-sidebar-head">
              <div className="eyebrow">Stores</div>
              <div className="mt-2 text-sm text-slate-600">{vendors.length} active vendors</div>
              <div className="mt-2 text-xs text-slate-500">Socket: {socketState}</div>
            </div>
            <div className="chat-sidebar-list">
              {vendors.map((vendor) => (
                <div key={vendor._id} className="rounded-[22px] border border-black/8 bg-white/70 p-4">
                  <strong className="block text-ink">{vendor.storeName}</strong>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{vendor.storeDescription}</p>
                  <div className="mt-3 text-xs text-slate-500">{vendor.productCount} products</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/store/${vendor.storeSlug}`} className="btn-secondary">Visit</Link>
                    <button type="button" className="btn-primary" onClick={() => startSupport(vendor)}>Chat</button>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="chat-main">
            <div className="chat-main-head">
              <div>
                <div className="eyebrow">Conversation</div>
                <h2 className="mt-1 text-2xl font-semibold text-ink">{selectedVendor?.storeName || "Select a vendor"}</h2>
                <div className="mt-1 text-sm text-slate-500">
                  {selectedConversation ? selectedConversation.subject : "Open or select a support thread"}
                </div>
              </div>
              {selectedVendor ? <Link href={`/store/${selectedVendor.storeSlug}`} className="soft-link">Go to store</Link> : null}
            </div>

            <div className="grid gap-4 border-b border-black/8 bg-white/45 p-4 md:grid-cols-[320px_1fr]">
              <div className="grid gap-3">
                {conversations.length ? conversations.map((conversation) => {
                  const vendor = vendors.find((entry) => String(entry._id) === String(getConversationVendorId(conversation)));

                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() => {
                        setSelectedConversationId(String(conversation._id));
                        if (vendor) setSelectedVendorId(String(vendor._id));
                      }}
                      className={`chat-thread-button ${String(selectedConversationId) === String(conversation._id) ? "active" : "inactive"}`}
                    >
                      <strong className="block text-sm text-ink">{conversation.subject}</strong>
                      <span className="mt-1 block text-xs text-slate-500">{vendor?.storeName || "Marketplace support"}</span>
                      <div className="mt-3 line-clamp-1 text-sm text-slate-600">{conversation.lastMessagePreview || "No messages yet"}</div>
                    </button>
                  );
                }) : (
                  <div className="chat-empty">No support conversations yet.</div>
                )}
              </div>

              <div className="chat-scroll min-h-[320px] rounded-[24px] border border-black/8 bg-white/35">
                {messages.length ? messages.map((message) => (
                  <div
                    key={message._id}
                    className={`chat-bubble ${getMessageSide(selectedConversation, message, userId)}`}
                  >
                    <div className="mb-1 text-[11px] uppercase tracking-[0.18em] opacity-70">{message.senderName || "Support"}</div>
                    <div>{message.body}</div>
                  </div>
                )) : (
                  <div className="chat-empty">
                    {selectedConversationId ? "No messages yet. Send the first support message." : "Select or create a support thread to start chatting."}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={sendMessage} className="chat-composer">
              <div className="chat-composer-row">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={2}
                  placeholder={selectedConversationId ? "Write your message to the vendor" : "Open a support thread first"}
                  className="field-input"
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

      <div className="glass-card p-5">
        <div className="eyebrow">Contact form</div>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Send a marketplace support request</h2>
        <p className="mt-2 text-sm text-slate-600">Use this if you are not logged in or need to contact the marketplace team directly.</p>
        <form
          className="mt-5 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const token = tokenStore.get();
              const response = await marketplaceApi.submitContact({
                ...contactForm,
                vendorSlug: selectedVendor?.storeSlug || preferredVendorSlug || ""
              }, token);
              setContactForm({ name: "", email: "", subject: "", message: "" });
              setNotice("Contact form sent successfully.");
              if (token && response.data?.conversation?._id) {
                await refreshConversations(token, response.data.conversation._id);
              }
            } catch (error) {
              setNotice(error.message || "Unable to send contact form.");
            }
          }}
        >
          <input className="field-input" placeholder="Your name" value={contactForm.name} onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))} required />
          <input className="field-input" type="email" placeholder="Your email" value={contactForm.email} onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))} required />
          <input className="field-input" placeholder="Subject" value={contactForm.subject} onChange={(event) => setContactForm((current) => ({ ...current, subject: event.target.value }))} required />
          <textarea className="field-input" rows={5} placeholder="How can we help?" value={contactForm.message} onChange={(event) => setContactForm((current) => ({ ...current, message: event.target.value }))} required />
          <button className="btn-primary w-fit" type="submit">Send contact form</button>
        </form>
      </div>
    </section>
  );
}
