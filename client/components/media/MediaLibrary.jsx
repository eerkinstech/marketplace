"use client";

import { useRef, useState } from "react";
import { getImageSource } from "@/lib/utils/images";

function Icon({ name, className = "h-4 w-4" }) {
  const icons = {
    upload: <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0-4 4m4-4 4 4M5 18v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

export default function MediaLibrary({ eyebrow, title, error, items, onUpload, onDelete, onBulkDelete, showOwnerLabel = false }) {
  const inputRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [busy, setBusy] = useState("");

  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(String(item._id || item.id)));

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) {
      alert("Please select image files only.");
      return;
    }

    try {
      setBusy("upload");
      const images = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (event) => resolve(String(event.target?.result || ""));
              reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
              reader.readAsDataURL(file);
            })
        )
      );
      await onUpload(images);
    } catch (uploadError) {
      alert(uploadError.message || "Upload failed.");
    } finally {
      setBusy("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(String(id)) ? current.filter((entry) => entry !== String(id)) : [...current, String(id)]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(items.map((item) => String(item._id || item.id)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    setBusy(String(id));
    try {
      await onDelete(id);
      setSelectedIds((current) => current.filter((entry) => entry !== String(id)));
    } finally {
      setBusy("");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected image(s)?`)) return;

    setBusy("bulk-delete");
    try {
      await onBulkDelete(selectedIds);
      setSelectedIds([]);
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="container page-section stack">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="page-title">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedIds.length ? (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={busy === "bulk-delete"}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
            >
              <Icon name="trash" />
              {busy === "bulk-delete" ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy === "upload"}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#1f2937] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Icon name="upload" />
            {busy === "upload" ? "Uploading..." : "Upload Images"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>
      </div>

      {error ? <div className="card section small">{error}</div> : null}

      {items.length ? (
        <>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            <span>{items.length} image(s)</span>
          </div>

          <div className="grid gap-5 grid-cols-5">
            {items.map((item) => {
              const id = String(item._id || item.id);
              const selected = selectedIds.includes(id);
              const imageUrl = getImageSource(item);

              return (
                <article key={id} className={`glass-card p-4 transition ${selected ? "ring-2 ring-[#0f766e]" : ""}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={selected} onChange={() => toggleSelect(id)} />
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Select</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDelete(id)}
                      disabled={busy === id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-700 disabled:opacity-50"
                      title="Delete image"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="aspect-square overflow-hidden rounded-[18px] bg-mist">
                    {imageUrl ? <img src={imageUrl} alt={item.alt || "Media image"} className="h-full w-full object-cover" /> : null}
                  </div>
                  {showOwnerLabel ? (
                    <div className="mt-3 text-sm font-medium text-slate-600">
                      {item.ownerLabel || item.owner?.storeName || item.owner?.name || "Marketplace"}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="glass-card p-8 text-center text-sm text-slate-600">No images uploaded yet.</div>
      )}
    </section>
  );
}