"use client";

import { AdminSidebar } from "./AdminSidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="ml-72 flex-1 overflow-auto">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
}
