import { API_URL } from "@/lib/constants/site";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

function normalizePath(source) {
  if (!source) return "";

  if (source.startsWith("data:") || source.startsWith("blob:")) {
    return source;
  }

  if (source.startsWith("/uploads/")) {
    return `${API_ORIGIN}${source}`;
  }

  try {
    const url = new URL(source);
    if (url.pathname.startsWith("/uploads/")) {
      return `${API_ORIGIN}${url.pathname}`;
    }
    return source;
  } catch {
    return source;
  }
}

export function getImageSource(image) {
  if (typeof image === "string") return normalizePath(image);

  return normalizePath(
    image?.url ||
    image?.src ||
    image?.secure_url ||
    ""
  );
}
