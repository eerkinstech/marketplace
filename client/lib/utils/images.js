function normalizePath(source) {
  if (!source) return "";

  if (source.startsWith("data:") || source.startsWith("blob:")) {
    return source;
  }

  if (source.startsWith("/uploads/")) {
    return source;
  }

  try {
    const url = new URL(source);
    if (url.pathname.startsWith("/uploads/")) {
      return url.pathname;
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
