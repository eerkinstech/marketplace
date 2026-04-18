"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { tokenStore } from "@/lib/auth/token-store";
import { marketplaceApi } from "@/lib/api/marketplace";

function getSocketUrl() {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
  if (typeof window === "undefined") return "http://localhost:5000";
  return `${window.location.protocol}//${window.location.hostname}:5000`;
}

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

function findVendorSupportConversation(conversations, vendorId) {
  return conversations.find((conversation) => {
    if (conversation.label !== "customer") return false;
    if (String(getConversationVendorId(conversation)) === String(vendorId)) return true;
    return false;
  }) || null;
}

export default function SupportPage() {
  const router = useRouter();
  const socketRef = useRef(null);
  const autoOpenedVendorRef = useRef("");
  const [preferredVendorSlug, setPreferredVendorSlug] = useState("");
  const [socketState, setSocketState] = useState("Login required");
  const [vendors, setVendors] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [openingVendorId, setOpeningVendorId] = useState("");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");

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
    if (!token) {
      setSocketState("Login required");
      setUserRole("");
      return;
    }

    const payload = decodeToken(token);
    setUserId(payload?.sub || "");
    setSocketState("Connecting");

    marketplaceApi.getAuthProfile(token)
      .then((response) => setUserRole(response.data?.role || payload?.role || ""))
      .catch(() => setUserRole(payload?.role || ""));

    marketplaceApi.getConversations(token)
      .then((response) => setConversations(response.data || []))
      .catch(() => setNotice("Unable to load your support conversations."));

    const socket = io(getSocketUrl(), { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => setSocketState("Connected"));
    socket.on("disconnect", () => setSocketState("Disconnected"));
    socket.on("connect_error", () => setSocketState("Connection failed"));
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
    if (!preferredVendorSlug || !vendors.length) return;

    const vendor = vendors.find((entry) => entry.storeSlug === preferredVendorSlug);
    if (!vendor) return;

    const vendorId = String(vendor._id);
    if (autoOpenedVendorRef.current === vendorId) return;

    autoOpenedVendorRef.current = vendorId;
    startSupport(vendor).catch(() => {
      autoOpenedVendorRef.current = "";
    });
  }, [preferredVendorSlug, vendors, conversations]);

  useEffect(() => {
    if (!selectedVendorId || !conversations.length) return;

    const existing = findVendorSupportConversation(conversations, selectedVendorId);
    if (!existing) return;
    if (String(selectedConversationId) === String(existing._id)) return;

    setSelectedConversationId(String(existing._id));
  }, [selectedVendorId, selectedConversationId, conversations]);

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
    const vendorId = String(vendor._id);
    setOpeningVendorId(vendorId);
    setSelectedVendorId(vendorId);
    setSelectedConversationId("");
    setMessages([]);
    setNotice("");
    const token = tokenStore.get();
    if (!token) {
      setOpeningVendorId("");
      router.push(`/login?redirect=${encodeURIComponent(`/support?vendor=${vendor.storeSlug}`)}`);
      return "";
    }

    if (userRole && userRole !== "customer") {
      setOpeningVendorId("");
      setNotice("Vendor chat can only be opened from a customer account.");
      return "";
    }

    const existing = findVendorSupportConversation(conversations, vendorId);

    if (existing) {
      setSelectedConversationId(String(existing._id));
      setSelectedVendorId(vendorId);
      setNotice(`Opened existing support thread for ${vendor.storeName}.`);
      setOpeningVendorId("");
      return String(existing._id);
    }

    try {
      const response = await marketplaceApi.createConversation(token, {
        participants: [vendorId],
        subject: `Support request for ${vendor.storeName}`
      });

      const conversation = response.data;
      setConversations((current) => {
        const alreadyExists = current.some((entry) => String(entry._id) === String(conversation._id));
        return alreadyExists ? current : [conversation, ...current];
      });
      setSelectedConversationId(String(conversation._id));
      setSelectedVendorId(vendorId);
      setNotice(`Opened support thread for ${vendor.storeName}.`);
      return String(conversation._id);
    } catch (error) {
      setSelectedVendorId("");
      setSelectedConversationId("");
      setMessages([]);
      setNotice(error.message || "Unable to open vendor support right now.");
      return "";
    } finally {
      setOpeningVendorId("");
    }
  }

  async function ensureSupportConversation() {
    if (selectedConversationId) return selectedConversationId;
    if (!selectedVendor) return "";

    const existing = findVendorSupportConversation(conversations, selectedVendor._id);
    if (existing) {
      const conversationId = String(existing._id);
      setSelectedConversationId(conversationId);
      return conversationId;
    }

    return await startSupport(selectedVendor);
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!draft.trim() || !selectedVendorId) return;

    let conversationId = selectedConversationId;
    if (!conversationId) {
      conversationId = await ensureSupportConversation();
    }
    if (!conversationId) return;

    socketRef.current?.emit("message:send", {
      conversationId,
      body: draft.trim(),
      attachments: []
    });
    setDraft("");
  }

  return (
    <section className="container page-section stack">
      <div
        className="overflow-hidden rounded-[36px] border border-black/8 px-6 py-8 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10 lg:py-10"
        style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--white) 96%, transparent) 0%, color-mix(in srgb, var(--secondary) 20%, var(--white)) 46%, color-mix(in srgb, var(--accent) 10%, var(--white)) 100%)" }}
      >
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="eyebrow">Support center</div>
            <h1 className="mt-3 max-w-4xl text-4xl font-medium tracking-[-0.04em] text-ink sm:text-5xl">
              Chat directly with vendor stores from one cleaner support workspace.
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Use this page to open vendor conversations, continue existing support threads, and manage replies in a more structured chat view. For general marketplace enquiries, use the separate contact page.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/contact-us" className="rounded-[24px] border border-black/8 bg-white/75 px-5 py-4 text-sm font-semibold text-ink transition hover:bg-white">
              Contact us
            </Link>
            <Link href="/faqs" className="rounded-[24px] border border-black/8 bg-white/75 px-5 py-4 text-sm font-semibold text-ink transition hover:bg-white">
              FAQs
            </Link>
            <Link href="/account" className="rounded-[24px] border border-black/8 bg-white/75 px-5 py-4 text-sm font-semibold text-ink transition hover:bg-white">
              My account
            </Link>
            <Link href="/returns" className="rounded-[24px] border border-black/8 bg-white/75 px-5 py-4 text-sm font-semibold text-ink transition hover:bg-white">
              Returns
            </Link>
          </div>
        </div>
      </div>

      {notice ? <div className="glass-card p-4 text-sm text-slate-600">{notice}</div> : null}

      <div className="chat-shell overflow-hidden rounded-[32px] border border-black/8 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--white)_95%,transparent)_0%,color-mix(in_srgb,var(--secondary)_16%,var(--white))_100%)] p-3 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-4">
        <div className="chat-layout">
          <aside className="chat-sidebar">
            <div className="chat-sidebar-head rounded-[26px] border border-black/8 bg-white/75">
              <div className="eyebrow">Stores</div>
              <div className="mt-2 text-sm text-slate-600">{vendors.length} active vendors</div>
              <div className="mt-2 text-xs text-slate-500">Socket: {socketState}</div>
            </div>
            <div className="chat-sidebar-list">
              {vendors.map((vendor) => (
                <div key={vendor._id} className="rounded-[24px] border border-black/8 bg-white/80 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                  <strong className="block text-ink">{vendor.storeName}</strong>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{vendor.storeDescription}</p>
                  <div className="mt-3 inline-flex rounded-full border border-black/8 bg-[#f8f5ef] px-3 py-1 text-xs font-semibold text-slate-600">
                    {vendor.productCount} products
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/store/${vendor.storeSlug}`} className="btn-secondary">Visit</Link>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={Boolean(userRole && userRole !== "customer")}
                      onClick={() => startSupport(vendor)}
                    >
                      {userRole && userRole !== "customer"
                        ? "Customer only"
                        : openingVendorId === String(vendor._id)
                          ? "Opening..."
                          : "Chat"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="chat-main">
            <div className="chat-main-head rounded-[26px] border border-black/8 bg-white/75">
              <div>
                <div className="eyebrow">Conversation</div>
                <h2 className="mt-1 text-2xl font-semibold text-ink">{selectedVendor?.storeName || "Select a vendor"}</h2>
                <div className="mt-1 text-sm text-slate-500">
                  {selectedConversation ? selectedConversation.subject : "Open or select a support thread"}
                </div>
              </div>
              {selectedVendor ? <Link href={`/store/${selectedVendor.storeSlug}`} className="soft-link">Go to store</Link> : null}
            </div>

            <div className="grid gap-4 rounded-[26px] border border-black/8 bg-white/55 p-4 md:grid-cols-[320px_1fr]">
              <div className="grid gap-3">
                {conversations.length ? conversations.map((conversation) => {
                  const vendor = vendors.find((entry) => String(entry._id) === String(getConversationVendorId(conversation)));
                  const isActiveConversation = String(selectedConversationId) === String(conversation._id);

                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() => {
                        setSelectedConversationId(String(conversation._id));
                        if (vendor) setSelectedVendorId(String(vendor._id));
                      }}
                      className={`chat-thread-button ${isActiveConversation ? "active" : "inactive"}`}
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
                {selectedVendorId && !selectedConversationId && openingVendorId === selectedVendorId ? (
                  <div className="chat-empty">Opening chat for {selectedVendor?.storeName || "vendor"}...</div>
                ) : null}
                {messages.length ? messages.map((message) => (
                  <div
                    key={message._id}
                    className={`chat-bubble ${getMessageSide(selectedConversation, message, userId)}`}
                  >
                    <div className="mb-1 text-[11px] uppercase tracking-[0.18em] opacity-70">{message.senderName || "Support"}</div>
                    <div>{message.body}</div>
                  </div>
                )) : (
                  !selectedVendorId || selectedConversationId ? (
                    <div className="chat-empty">
                      {selectedConversationId ? "No messages yet. Send the first support message." : "Select or create a support thread to start chatting."}
                    </div>
                  ) : null
                )}
              </div>
            </div>

            <form onSubmit={sendMessage} className="chat-composer rounded-[26px] border border-black/8 bg-white/75 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="eyebrow">Reply</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {userRole && userRole !== "customer"
                      ? "This support view opens vendor chat from a customer account."
                      : "Send a message inside the selected support thread."}
                  </div>
                </div>
                <Link href="/contact-us" className="hidden text-sm font-semibold text-[color:var(--accent)] transition hover:text-ink sm:inline">
                  Need marketplace help?
                </Link>
              </div>
              <div className="chat-composer-row">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={2}
                  placeholder={selectedVendorId ? "Write your message to the vendor" : "Select a vendor chat first"}
                  className="field-input"
                  disabled={!selectedVendorId}
                />
                <button className="btn-primary" type="submit" disabled={!selectedVendorId || !draft.trim()}>
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
