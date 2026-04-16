export function normalizeRedirectPath(path = "") {
  const raw = String(path || "").trim();
  if (!raw) return "/";

  const [pathname] = raw.split("?");
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");

  if (collapsed !== "/" && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }

  return collapsed;
}

export function isExternalRedirectTarget(path = "") {
  return /^https?:\/\//i.test(String(path || "").trim());
}
