"use client";

import { useEffect, useState } from "react";
import { tokenStore } from "@/lib/auth/token-store";

export function useAccessToken(requiredMessage) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = tokenStore.get();
    if (!stored) setError(requiredMessage);
    else setToken(stored);
  }, [requiredMessage]);

  return { token, error, setError };
}
