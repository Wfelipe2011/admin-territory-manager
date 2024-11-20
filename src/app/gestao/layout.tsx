import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ReportsDrawer } from "@/components/ReportsDrawer"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <main className="w-full pt-8">
        <ReportsDrawer />
        {children}
      </main>
    </SidebarProvider>
  )
}
