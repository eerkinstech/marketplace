import { VendorSidebar } from "@/components/vendor/VendorSidebar";

export const metadata = {
  title: {
    absolute: "Vendor Dashboard"
  },
  description: "Marketplace vendor dashboard.",
  robots: {
    index: false,
    follow: false
  }
};

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
