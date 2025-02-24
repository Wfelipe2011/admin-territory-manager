import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ReportsDrawer } from "@/components/ReportsDrawer";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full bg-gray-100">
        <div className="w-full h-10 bg-primary">
          <ReportsDrawer />
        </div>
        <div className="w-full bg-gray-100">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
