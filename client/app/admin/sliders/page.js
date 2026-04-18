"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

function createEmptySlide() {
  return {
    eyebrow: "",
    title: "",
    subtitle: "",
    description: "",
    label: "",
    href: "",
    imageUrl: "",
    mobileImageUrl: "",
    backgroundColor: "",
    textColor: "",
    accentColor: "",
    badge: ""
  };
}

function normalizeCollection(response) {
  const rows = response?.data || response || [];
  return Array.isArray(rows) ? rows : [];
}

function generateSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result || ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file?.name || "image"}`));
    reader.readAsDataURL(file);
  });
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0a5a46] ${props.className || ""}`}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0a5a46] ${props.className || ""}`}
    />
  );
}

function UploadField({ value, onChange, onUpload, uploading }) {
  const inputRef = useRef(null);

  return (
    <div className="grid gap-3">
      <TextInput value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="Image URL" />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-2xl border border-black/10 bg-[#faf7f2] px-4 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
          >
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

export default function AdminSlidersPage() {
  const { token, error: authError, setError: setAuthError } = useAccessToken(
    "Login with an admin account to manage homepage sliders."
  );

  const [sections, setSections] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token) return;

    async function loadPage() {
      try {
        setLoading(true);
        const response = await marketplaceApi.getAdminHomeSections(token);
        const sliders = normalizeCollection(response).filter((section) => section.sectionType === "hero_slider");
        setSections(sliders);
        setActiveId((current) => current || sliders[0]?._id || "");
        setPageError("");
      } catch (error) {
        const message = error?.message || "Failed to load sliders";
        setPageError(message);
        setAuthError(message);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [token, setAuthError]);

  const activeSection = useMemo(
    () => sections.find((section) => String(section._id) === String(activeId)) || null,
    [sections, activeId]
  );

  function updateSection(patch) {
    if (!activeSection) return;
    setSections((current) =>
      current.map((section) => (String(section._id) === String(activeSection._id) ? { ...section, ...patch } : section))
    );
  }

  function updateSlide(index, patch) {
    if (!activeSection) return;
    const nextItems = [...(activeSection.items || [])];
    nextItems[index] = { ...(nextItems[index] || createEmptySlide()), ...patch };
    updateSection({ items: nextItems });
  }

  function addSlider() {
    const next = {
      _id: `draft-${Date.now()}`,
      isDraft: true,
      name: `Home Slider ${sections.length + 1}`,
      slug: `home-slider-${sections.length + 1}`,
      sectionType: "hero_slider",
      order: sections.length * 10,
      isActive: true,
      title: "",
      subtitle: "",
      description: "",
      ctaLabel: "",
      ctaHref: "",
      imageUrl: "",
      mobileImageUrl: "",
      items: [createEmptySlide()]
    };
    setSections((current) => [...current, next]);
    setActiveId(next._id);
    setNotice("");
  }

  function addSlide() {
    if (!activeSection) return;
    updateSection({ items: [...(activeSection.items || []), createEmptySlide()] });
  }

  function removeSlide(index) {
    if (!activeSection) return;
    updateSection({ items: (activeSection.items || []).filter((_, itemIndex) => itemIndex !== index) });
  }

  async function uploadImage(file, assign) {
    if (!token || !file) return;

    try {
      setUploading(true);
      setPageError("");
      const image = await fileToDataUrl(file);
      const response = await marketplaceApi.createAdminMedia(token, { images: [image] });
      const uploaded = Array.isArray(response?.data) ? response.data[0] : response?.data?.[0];
      if (!uploaded?.url) throw new Error("Image upload failed");
      assign(uploaded.url);
      setNotice("Image uploaded.");
    } catch (error) {
      setPageError(error?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function saveSlider() {
    if (!token || !activeSection) return;

    const payload = {
      name: activeSection.name || "Home Slider",
      slug: activeSection.slug || generateSlug(activeSection.name || "home-slider"),
      sectionType: "hero_slider",
      order: Number(activeSection.order || 0),
      isActive: Boolean(activeSection.isActive),
      title: activeSection.title || "",
      subtitle: activeSection.subtitle || "",
      description: activeSection.description || "",
      ctaLabel: activeSection.ctaLabel || "",
      ctaHref: activeSection.ctaHref || "",
      imageUrl: activeSection.imageUrl || "",
      mobileImageUrl: activeSection.mobileImageUrl || "",
      items: (activeSection.items || []).map((item) => ({
        eyebrow: item.eyebrow || "",
        title: item.title || "",
        subtitle: item.subtitle || "",
        description: item.description || "",
        label: item.label || "",
        href: item.href || "",
        imageUrl: item.imageUrl || "",
        mobileImageUrl: item.mobileImageUrl || ""
      }))
    };

    try {
      setSaving(true);
      setPageError("");
      const response = activeSection.isDraft
        ? await marketplaceApi.createAdminHomeSection(token, payload)
        : await marketplaceApi.updateAdminHomeSection(token, activeSection._id, payload);
      const saved = { ...(response?.data || response), isDraft: false };
      setSections((current) =>
        current.map((section) => (String(section._id) === String(activeSection._id) ? saved : section))
      );
      setActiveId(saved._id);
      setNotice(`Saved "${saved.name}".`);
    } catch (error) {
      setPageError(error?.message || "Failed to save slider");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="container page-section stack">
      <div className="grid gap-3 lg:grid-cols-[1.1fr_auto] lg:items-end">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9a6b36]">Admin Panel</div>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-900">Sliders</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Create and edit homepage slider sections here. This page is only for hero sliders.
          </p>
        </div>

        <button
          type="button"
          onClick={addSlider}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#111111] px-5 text-sm font-semibold text-white"
        >
          Add Slider
        </button>
      </div>

      {authError ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{authError}</div> : null}
      {pageError ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{pageError}</div> : null}
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{notice}</div> : null}

      <div className="rounded-[30px] border border-black/6 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-black/6 p-4">
          <div className="flex gap-2 overflow-x-auto">
            {sections.map((section, index) => (
              <button
                key={section._id}
                type="button"
                onClick={() => setActiveId(section._id)}
                className={`min-w-[220px] rounded-[22px] border px-4 py-3 text-left transition ${String(section._id) === String(activeId) ? "border-[#0a5a46] bg-[#edf7f2]" : "border-black/8 bg-[#faf7f2] hover:bg-[#f4efe8]"}`}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Slider {index + 1}</div>
                <div className="mt-2 truncate text-base font-black text-slate-900">{section.name || "Untitled slider"}</div>
                <div className="mt-1 text-xs text-slate-500">{section.isActive ? "Active" : "Hidden"}</div>
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="p-8 text-sm text-slate-500">Loading sliders...</div> : null}

        {!loading && activeSection ? (
          <div className="grid gap-6 p-6">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Slider Name">
                <TextInput value={activeSection.name || ""} onChange={(event) => updateSection({ name: event.target.value })} />
              </Field>
              <Field label="Heading">
                <TextInput value={activeSection.title || ""} onChange={(event) => updateSection({ title: event.target.value })} />
              </Field>
              <Field label="Order">
                <TextInput type="number" value={activeSection.order ?? 0} onChange={(event) => updateSection({ order: Number(event.target.value || 0) })} />
              </Field>
              <label className="flex items-center gap-3 rounded-[24px] border border-black/8 bg-[#faf7f2] px-4 py-4 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(activeSection.isActive)}
                  onChange={(event) => updateSection({ isActive: event.target.checked })}
                  className="h-4 w-4 rounded border-black/20"
                />
                Show Slider
              </label>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-slate-900">Slides</div>
                  <div className="text-sm text-slate-500">Edit only the slide content used by the homepage hero.</div>
                </div>
                <button
                  type="button"
                  onClick={addSlide}
                  className="rounded-2xl border border-black/10 bg-[#faf7f2] px-4 py-2.5 text-sm font-semibold text-slate-900"
                >
                  Add Slide
                </button>
              </div>

              {(activeSection.items || []).map((item, index) => (
                <div key={`${activeSection._id}-slide-${index}`} className="grid gap-4 rounded-[24px] border border-black/8 bg-[#fcfaf7] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-base font-black text-slate-900">Slide {index + 1}</div>
                    {(activeSection.items || []).length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeSlide(index)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Field label="Title">
                      <TextInput value={item.title || ""} onChange={(event) => updateSlide(index, { title: event.target.value })} />
                    </Field>
                    <Field label="Description">
                      <TextArea rows={4} value={item.description || item.subtitle || ""} onChange={(event) => updateSlide(index, { description: event.target.value, subtitle: event.target.value })} />
                    </Field>
                    <Field label="Button Label">
                      <TextInput value={item.label || ""} onChange={(event) => updateSlide(index, { label: event.target.value })} />
                    </Field>
                    <Field label="Button Link">
                      <TextInput value={item.href || ""} onChange={(event) => updateSlide(index, { href: event.target.value })} />
                    </Field>
                    <Field label="Desktop Image">
                      <UploadField
                        value={item.imageUrl || ""}
                        onChange={(value) => updateSlide(index, { imageUrl: value })}
                        onUpload={(file) => uploadImage(file, (value) => updateSlide(index, { imageUrl: value }))}
                        uploading={uploading}
                      />
                    </Field>
                    <Field label="Mobile Image">
                      <UploadField
                        value={item.mobileImageUrl || ""}
                        onChange={(value) => updateSlide(index, { mobileImageUrl: value })}
                        onUpload={(file) => uploadImage(file, (value) => updateSlide(index, { mobileImageUrl: value }))}
                        uploading={uploading}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-black/6 pt-4">
              <button
                type="button"
                onClick={saveSlider}
                disabled={saving}
                className="rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Slider"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
