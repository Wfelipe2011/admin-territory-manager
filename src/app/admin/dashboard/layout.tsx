import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarTrigger />
      <AppSidebar />
      <main className="w-full pt-8">
        {children}
      </main>
    </SidebarProvider>
  )
}
