import { API_URL, SITE_URL } from "@/lib/constants/site";

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/catalog/feed/products.xml`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Feed request failed: ${response.status}`);
    }

    return new Response(await response.text(), {
      headers: {
        "Content-Type": "application/xml"
      }
    });
  } catch {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Marketplace Product Feed</title><description>Backend API unavailable</description><link>${SITE_URL}</link></channel></rss>`,
      {
        status: 503,
        headers: {
          "Content-Type": "application/xml"
        }
      }
    );
  }
}
