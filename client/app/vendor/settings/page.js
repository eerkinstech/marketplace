"use client";

import { useEffect, useRef, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  storeName: "",
  storeLogo: "",
  profileImage: "",
  password: "",
  addressLine: "",
  city: "",
  state: "",
  country: "",
  postalCode: ""
};

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif"
]);

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function ImagePicker({ label, hint, value, onPick, inputRef }) {
  return (
    <div className="grid gap-4 rounded-[28px] border border-black/6 bg-white/80 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-ink">{label}</div>
          <div className="mt-1 text-sm text-slate-500">{hint}</div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
        >
          Upload
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.avif"
        className="hidden"
        onChange={onPick}
      />

      <div className="overflow-hidden rounded-[24px] border border-dashed border-black/10 bg-[#f7f5f1]">
        {value ? (
          <img src={value} alt={label} className="h-48 w-full object-cover" />
        ) : (
          <div className="flex h-48 items-center justify-center px-6 text-center text-sm text-slate-500">
            No image selected yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorSettingsPage() {
  const { token, error, setError } = useAccessToken("Login with a vendor account to manage store settings.");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const logoInputRef = useRef(null);
  const profileInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const response = await marketplaceApi.getVendorProfile(token);
        setForm({
          name: response.data?.name || "",
          email: response.data?.email || "",
          phone: response.data?.phone || "",
          storeName: response.data?.storeName || "",
          storeLogo: response.data?.storeLogo || "",
          profileImage: response.data?.profileImage || "",
          password: "",
          addressLine: response.data?.addressLine || "",
          city: response.data?.city || "",
          state: response.data?.state || "",
          country: response.data?.country || "",
          postalCode: response.data?.postalCode || ""
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, setError]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleImagePick(field, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      setError("Unsupported image format. Use JPG, PNG, WEBP, GIF, SVG, or AVIF.");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((current) => ({ ...current, [field]: dataUrl }));
      setNotice("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) return;

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const response = await marketplaceApi.updateVendorProfile(token, form);
      setForm({
        name: response.data?.name || "",
        email: response.data?.email || "",
        phone: response.data?.phone || "",
        storeName: response.data?.storeName || "",
        storeLogo: response.data?.storeLogo || "",
        profileImage: response.data?.profileImage || "",
        password: "",
        addressLine: response.data?.addressLine || "",
        city: response.data?.city || "",
        state: response.data?.state || "",
        country: response.data?.country || "",
        postalCode: response.data?.postalCode || ""
      });
      setNotice(response.message || "Settings saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-[30px] border border-black/5 bg-white/78 p-8 shadow-soft backdrop-blur-md">
        <div className="eyebrow">Vendor</div>
        <h1 className="mt-3 font-display text-4xl font-bold text-ink">Store settings</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Update the contact and branding details customers see across your vendor workspace and storefront.
        </p>
      </div>

      {error ? <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">{notice}</div> : null}

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-6 rounded-[30px] border border-black/5 bg-white/82 p-6 shadow-soft backdrop-blur-md md:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Person name</span>
              <input name="name" value={form.name} onChange={updateField} className="field-input" placeholder="Vendor owner or manager" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Store name</span>
              <input name="storeName" value={form.storeName} onChange={updateField} className="field-input" placeholder="Your store name" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Email</span>
              <input name="email" type="email" value={form.email} onChange={updateField} className="field-input" placeholder="store@example.com" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Phone number</span>
              <input name="phone" value={form.phone} onChange={updateField} className="field-input" placeholder="+1 555 123 4567" />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-ink">Password</span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                className="field-input"
                placeholder="Leave blank to keep current password"
              />
            </label>
          </div>

          <div className="grid gap-5 rounded-[28px] border border-black/6 bg-white/70 p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-ink">Vendor address</div>
              <div className="mt-1 text-sm text-slate-500">This address is saved on your vendor profile.</div>
            </div>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-ink">Address line</span>
              <input name="addressLine" value={form.addressLine} onChange={updateField} className="field-input" placeholder="Street address, building, suite" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">City</span>
              <input name="city" value={form.city} onChange={updateField} className="field-input" placeholder="City" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">State</span>
              <input name="state" value={form.state} onChange={updateField} className="field-input" placeholder="State / Province" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Country</span>
              <input name="country" value={form.country} onChange={updateField} className="field-input" placeholder="Country" />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-ink">Postal code</span>
              <input name="postalCode" value={form.postalCode} onChange={updateField} className="field-input" placeholder="Postal code" />
            </label>
          </div>

          <div className="rounded-[28px] border border-[#dde7e1] bg-[linear-gradient(135deg,#f6faf7_0%,#eef4f1_100%)] p-5">
            <div className="text-sm font-semibold text-ink">Live storefront preview</div>
            <div className="mt-4 flex flex-col gap-4 rounded-[24px] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-[20px] border border-black/8 bg-[#f4ede4]">
                  {form.storeLogo ? <img src={form.storeLogo} alt="Store logo preview" className="h-full w-full object-cover" /> : null}
                </div>
                <div>
                  <div className="text-lg font-bold text-ink">{form.storeName || "Your store name"}</div>
                  <div className="text-sm text-slate-500">{form.email || "store@example.com"}</div>
                  <div className="text-sm text-slate-500">{form.phone || "Phone number"}</div>
                </div>
              </div>
              <div className="sm:ml-auto">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-black/8 bg-[#efe8de]">
                  {form.profileImage ? <img src={form.profileImage} alt="Profile preview" className="h-full w-full object-cover" /> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-full bg-[#0f766e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0c5c56] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          <ImagePicker
            label="Store logo"
            hint="Used for store cards, headers, and vendor references."
            value={form.storeLogo}
            inputRef={logoInputRef}
            onPick={(event) => handleImagePick("storeLogo", event)}
          />

          <ImagePicker
            label="Person image"
            hint="Upload the main person or owner image for your vendor identity."
            value={form.profileImage}
            inputRef={profileInputRef}
            onPick={(event) => handleImagePick("profileImage", event)}
          />
        </div>
      </form>
    </section>
  );
}
