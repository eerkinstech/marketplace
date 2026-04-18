"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function AppChrome({ children }) {
  const pathname = usePathname() || "";
  const isAdminRoute = pathname.startsWith("/admin");
  const isVendorRoute = pathname.startsWith("/vendor");

  if (isAdminRoute || isVendorRoute) {
    return (
      <main className="page-transition-shell min-h-screen">
        <div key={pathname} className="page-transition-stage min-h-screen">
          {children}
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="page-transition-shell flex-1">
        <div key={pathname} className="page-transition-stage h-full">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
