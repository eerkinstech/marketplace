import { useRef, useState } from "react";
import { getImageSource } from "@/lib/utils/images";

function ImagesIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="4.5" width="11" height="11" rx="2" />
      <path d="M6 11l2.3-2.3a1 1 0 0 1 1.4 0L13.5 12.5" />
      <circle cx="8" cy="8" r="1" />
      <rect x="8.5" y="2.5" width="9" height="9" rx="2" />
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

function ZoomIcon({ className = "" }) {
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
      <circle cx="8.5" cy="8.5" r="4.75" />
      <path d="M12 12 16 16" />
      <path d="M8.5 6.5v4" />
      <path d="M6.5 8.5h4" />
    </svg>
  );
}

export default function ProductImages({ formData, setFormData }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const inputRef = useRef(null);
  const images = formData.images || [];

  function appendImages(nextImages) {
    setFormData({
      ...formData,
      images: [...images, ...nextImages]
    });
  }

  function handleFiles(fileList) {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) {
      alert("Please select image files only.");
      return;
    }

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(String(event.target?.result || ""));
            reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
            reader.readAsDataURL(file);
          })
      )
    )
      .then((result) => appendImages(result))
      .catch((error) => alert(error.message));
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  }

  function removeImage(index) {
    const nextImages = images.filter((_, imageIndex) => imageIndex !== index);
    const removedSource = getImageSource(images[index]);

    setFormData({
      ...formData,
      images: nextImages,
      variants: (formData.variants || []).map((variant) =>
        variant.image === removedSource ? { ...variant, image: "" } : variant
      )
    });

    if (previewImage === removedSource) {
      setPreviewImage("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <ImagesIcon className="h-5 w-5 text-blue-600" /> Product Images
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Upload multiple product images. Hover an image to remove it, or click the center preview icon to open it.
        </p>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition duration-200 ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }`}
        onClick={() => inputRef.current?.click()}
        >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <UploadIcon className="h-10 w-10 text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">Click to upload or drag and drop</span>
          <span className="text-xs text-gray-500">Upload product media in JPG, PNG, WEBP, GIF, SVG, or AVIF</span>
        </div>
      </div>

      {images.length > 0 ? (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-900">
            {images.length} Image{images.length !== 1 ? "s" : ""} Added
          </h4>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {images.map((image, index) => {
              const src = getImageSource(image);
              return (
                <div key={`${src}-${index}`} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <img src={src} alt={`Product ${index + 1}`} className="h-36 w-full object-cover" />

                  <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                    {index + 1}
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition group-hover:opacity-100"
                    title="Remove image"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPreviewImage(src);
                      }}
                      className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-900 opacity-0 shadow-lg transition group-hover:opacity-100"
                      title="Open image"
                    >
                      <ZoomIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <ImagesIcon className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-600">No images added yet</p>
        </div>
      )}

      {previewImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6" onClick={() => setPreviewImage("")}>
          <button
            type="button"
            onClick={() => setPreviewImage("")}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900"
            title="Close preview"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <img
            src={previewImage}
            alt="Product preview"
            className="max-h-[85vh] max-w-[85vw] rounded-2xl bg-white object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
