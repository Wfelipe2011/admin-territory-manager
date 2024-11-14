import { ChartNoAxesColumn, Map, PencilLine, ScrollText } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
    {
        title: "Início",
        url: "dashboard",
        icon: ChartNoAxesColumn,
    },
    {
        title: "Gestão de Territórios",
        url: "gestao",
        icon: Map,
    },
    {
        title: "Cadastros",
        url: "#",
        icon: PencilLine,
    },
    {
        title: "Relatórios",
        url: "#",
        icon: ScrollText,
    },
]

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" className="mt-8">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <>
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <a href={item.url} className="flex gap-3 my-1">
                                                <item.icon
                                                    style={{
                                                        width: "1.5rem",
                                                        height: "1.5rem"
                                                    }}
                                                    className="text-primary" />
                                                <span className="text-lg">{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                            
                                </>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
