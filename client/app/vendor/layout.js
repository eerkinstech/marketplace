import { VendorSidebar } from "@/components/vendor/VendorSidebar";

export default function VendorLayout({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5efe7]">
      <VendorSidebar />
      <div className="min-h-screen lg:pl-72">
        <div className="min-w-0 p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
