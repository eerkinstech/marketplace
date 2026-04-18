"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getImageSource } from "@/lib/utils/images";

function CloseIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6 14 14M14 6 6 14" />
    </svg>
  );
}

function UploadIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 13V4.5" />
      <path d="M7 7.5 10 4.5l3 3" />
      <path d="M4 14.5v1A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5v-1" />
    </svg>
  );
}

function normalizeItem(item, index) {
  const url = getImageSource(item);
  if (!url) return null;

  return {
    id: String(item?._id || item?.id || item?.publicId || `${url}-${index}`),
    url,
    alt: item?.alt || "",
    publicId: item?.publicId || ""
  };
}

async function readFilesAsDataUrls(fileList) {
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    throw new Error("Please select image files only.");
  }

  return Promise.all(
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
}

export default function MediaLibraryModal({
  open,
  mode = "multiple",
  title,
  description,
  items = [],
  selectedItems = [],
  allowUpload = false,
  emptyMessage = "No images found.",
  uploadLabel = "Upload images",
  onClose,
  onSave,
  onUpload
}) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedMap, setSelectedMap] = useState({});

  const normalizedItems = useMemo(
    () => items.map(normalizeItem).filter(Boolean),
    [items]
  );

  useEffect(() => {
    if (!open) return;

    const nextSelected = {};
    selectedItems.map(normalizeItem).filter(Boolean).forEach((item) => {
      nextSelected[item.url] = item;
    });
    setSelectedMap(nextSelected);
  }, [open, selectedItems]);

  if (!open) return null;

  const toggleItem = (item) => {
    setSelectedMap((current) => {
      if (mode === "single") {
        return current[item.url] ? {} : { [item.url]: item };
      }

      const nextState = { ...current };
      if (nextState[item.url]) {
        delete nextState[item.url];
      } else {
        nextState[item.url] = item;
      }
      return nextState;
    });
  };

  const handleUpload = async (fileList) => {
    if (!allowUpload || !onUpload) return;

    try {
      setBusy(true);
      const images = await readFilesAsDataUrls(fileList);
      const uploadedItems = await onUpload(images);
      const normalizedUploaded = (uploadedItems || []).map(normalizeItem).filter(Boolean);

      if (normalizedUploaded.length) {
        setSelectedMap((current) => {
          if (mode === "single") {
            const lastItem = normalizedUploaded[normalizedUploaded.length - 1];
            return lastItem ? { [lastItem.url]: lastItem } : current;
          }

          const nextState = { ...current };
          normalizedUploaded.forEach((item) => {
            nextState[item.url] = item;
          });
          return nextState;
        });
      }
    } catch (error) {
      alert(error.message || "Upload failed.");
    } finally {
      setBusy(false);
      setDragActive(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const selectedCount = Object.keys(selectedMap).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/8 px-6 py-5">
          <div>
            <h4 className="text-lg font-bold text-gray-950">{title}</h4>
            {description ? <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {allowUpload ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleUpload(event.dataTransfer.files);
              }}
              className={`mb-6 rounded-[22px] border-2 border-dashed px-6 py-8 text-center transition ${
                dragActive
                  ? "border-[#b87430] bg-[#fbf4ea]"
                  : "border-gray-300 bg-[#faf8f4]"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => handleUpload(event.target.files)}
              />
              <div className="flex flex-col items-center gap-3">
                <UploadIcon className="h-10 w-10 text-gray-400" />
                <div className="text-sm font-semibold text-gray-900">Drag and drop images here</div>
                <div className="text-xs text-gray-500">Or upload new files directly into the media library.</div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1f2937] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <UploadIcon className="h-4 w-4" />
                  {busy ? "Uploading..." : uploadLabel}
                </button>
              </div>
            </div>
          ) : null}

          {normalizedItems.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {normalizedItems.map((item, index) => {
                const selected = Boolean(selectedMap[item.url]);
                return (
                  <button
                    key={`${item.id}-${index}`}
                    type="button"
                    onClick={() => toggleItem(item)}
                    className={`overflow-hidden rounded-[22px] border-2 bg-white text-left transition ${
                      selected ? "border-[#b87430] ring-2 ring-[#ead1b4]" : "border-gray-200 hover:border-[#d2ad84]"
                    }`}
                  >
                    <img src={item.url} alt={item.alt || `Media ${index + 1}`} className="h-40 w-full object-cover" />
                    <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700">
                      <span className="truncate">{selected ? "Selected" : mode === "single" ? "Choose image" : "Add image"}</span>
                      {selected ? <span className="rounded-full bg-[#f4e4cf] px-2 py-0.5 text-[#8f5a20]">OK</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-gray-300 bg-[#fcfbf8] px-6 py-10 text-center text-sm text-gray-500">
              {emptyMessage}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-black/8 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            {mode === "single" ? `${selectedCount ? "1 image selected" : "No image selected"}` : `${selectedCount} image${selectedCount === 1 ? "" : "s"} selected`}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(Object.values(selectedMap))}
              className="rounded-xl bg-[#b87430] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {mode === "single" ? "Use image" : "Use selected images"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
