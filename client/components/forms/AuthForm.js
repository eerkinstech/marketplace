"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { marketplaceApi } from "@/lib/api/marketplace";
import { getFirstAccessibleAdminPath } from "@/lib/auth/admin-access";
import { tokenStore } from "@/lib/auth/token-store";

const formatDetails = (details) => {
  if (!details || typeof details !== "object") return "";

  const messages = Object.values(details)
    .flat()
    .filter(Boolean);

  return messages.join(" ");
};

export function AuthForm({ mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData) {
    setLoading(true);
    setError("");

    try {
      const payload = Object.fromEntries(formData.entries());

      Object.keys(payload).forEach((key) => {
        if (typeof payload[key] === "string") {
          payload[key] = payload[key].trim();
          if (payload[key] === "") delete payload[key];
        }
      });

      if (mode === "register" && payload.role === "vendor" && !payload.storeName) {
        throw new Error("Store name is required for vendor registration.");
      }

      const response = mode === "login"
        ? await marketplaceApi.login(payload)
        : await marketplaceApi.register(payload);

      tokenStore.set(response.data.accessToken);
      if (response.data.user.role === "admin") {
        const profileResponse = await marketplaceApi.getAuthProfile(response.data.accessToken);
        router.push(getFirstAccessibleAdminPath(profileResponse?.data || response.data.user));
      }
      else if (response.data.user.role === "vendor") router.push("/vendor/dashboard");
      else router.push("/account");
      router.refresh();
    } catch (err) {
      setError(formatDetails(err.details) || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="card section form-grid">
      <div className="form-field">
        <label>Name</label>
        <input name="name" placeholder="Aisha Khan" minLength={2} required={mode === "register"} />
      </div>
      <div className="form-field">
        <label>Email</label>
        <input type="email" name="email" placeholder="you@example.com" required />
      </div>
      <div className="form-field">
        <label>Password</label>
        <input type="password" name="password" placeholder="Minimum 8 characters" minLength={8} required />
      </div>
      {mode === "register" ? (
        <>
          <div className="form-field">
            <label>Role</label>
            <select name="role" defaultValue="customer">
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          <div className="form-field">
            <label>Store Name</label>
            <input name="storeName" placeholder="Required for vendors" minLength={3} />
          </div>
        </>
      ) : null}
      {error ? <div className="small" style={{ color: "#b42318" }}>{error}</div> : null}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
