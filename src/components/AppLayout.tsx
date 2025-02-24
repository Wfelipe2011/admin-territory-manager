import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ReportsDrawer } from "@/components/ReportsDrawer";

export function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full bg-gray-100">
        <div className="w-full h-10 bg-primary fixed top-0 z-10">
          <SidebarTrigger className="md:hidden" />
          <ReportsDrawer />
        </div>
        <div className="w-full mt-14 bg-gray-100 px-2">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
