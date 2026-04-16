import { NextResponse } from "next/server";
import { API_URL } from "@/lib/constants/site";

const EXCLUDED_PREFIXES = ["/api", "/_next", "/admin", "/vendor", "/account", "/uploads"];
const EXCLUDED_FILES = ["/favicon.ico", "/robots.txt", "/sitemap.xml"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    EXCLUDED_FILES.includes(pathname)
  ) {
    return NextResponse.next();
  }

  try {
    const response = await fetch(`${API_URL}/catalog/redirects/resolve?path=${encodeURIComponent(pathname)}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.next();
    }

    const payload = await response.json();
    const destinationPath = payload?.data?.destinationPath;
    const statusCode = Number(payload?.data?.statusCode || 301);
    if (!destinationPath) {
      return NextResponse.next();
    }

    const url = payload?.data?.isExternal
      ? destinationPath
      : new URL(destinationPath, request.url);

    return NextResponse.redirect(url, statusCode);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: "/:path*"
};
