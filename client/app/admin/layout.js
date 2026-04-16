import { AdminAccessGate } from "@/components/admin/AdminAccessGate";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Dashboard | Marketplace",
  description: "Marketplace administration panel"
};

export default function AdminLayout({ children }) {
  return (
    <AdminAccessGate>
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
        <AdminSidebar />

        <div className="min-h-screen lg:pl-72">
          <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
            <div className="px-8 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-900">Marketplace Admin</h1>
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600">
                  Admin User
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="min-w-0 p-6 lg:p-8">{children}</div>
          </div>
        </div>
      </div>
    </AdminAccessGate>
  );
}
