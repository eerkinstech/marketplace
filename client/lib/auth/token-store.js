"use client";

const TOKEN_KEY = "marketplace_access_token";

export const tokenStore = {
  get() {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(TOKEN_KEY) || "";
  },
  set(token) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new CustomEvent("auth:updated", { detail: { token } }));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent("auth:updated", { detail: { token: "" } }));
  }
};
