import { AdminAccessGate } from "@/components/admin/AdminAccessGate";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Dashboard | Marketplace",
  description: "Marketplace administration panel"
};

export default function AdminLayout({ children }) {
  return (
    <AdminAccessGate>
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
        <AdminSidebar />

        <div className="flex h-screen flex-col lg:ml-72">
          <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/88 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 lg:px-8">
              <h1 className="text-2xl font-bold text-slate-900">Marketplace Admin</h1>
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600">
                  Admin User
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="min-w-0 p-5 lg:p-8">{children}</div>
          </div>
        </div>
      </div>
    </AdminAccessGate>
  );
}
