import { AppSidebar, MobileTopBar } from "@/components/app-sidebar";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopBar />
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
