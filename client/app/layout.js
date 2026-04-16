import "../styles/globals.css";
import { AppChrome } from "@/components/layout/AppChrome";

export const metadata = {
  title: {
    default: "MarketSphere | Multi-Vendor Marketplace",
    template: "%s | MarketSphere"
  },
  description: "Production-ready multi-vendor marketplace built with Next.js and Express.",
  metadataBase: new URL("http://localhost:3000")
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
