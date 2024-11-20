import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ReportsDrawer } from "@/components/ReportsDrawer";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarTrigger />
      <AppSidebar />
      <main className="w-full pt-8">
        <ReportsDrawer />
        {children}
      </main>
    </SidebarProvider>
  );
}
