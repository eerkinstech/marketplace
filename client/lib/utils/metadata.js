import { SITE_NAME } from "@/lib/constants/site";

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cleanPageTitle(value, fallback = "") {
  const rawTitle = String(value || fallback || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!rawTitle) return fallback;

  const escapedSiteName = escapeRegExp(SITE_NAME);
  const siteSuffix = new RegExp(`\\s*[|\\-–—:]\\s*${escapedSiteName}\\s*$`, "i");
  let title = rawTitle.replace(new RegExp(`^${escapedSiteName}\\s*[|\\-–—:]\\s*`, "i"), "");

  while (siteSuffix.test(title)) {
    title = title.replace(siteSuffix, "").trim();
  }

  return title.replace(/\s+/g, " ").trim() || fallback;
}

export function cleanMetaDescription(value, fallback = "") {
  return String(value || fallback || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim() || undefined;
}
