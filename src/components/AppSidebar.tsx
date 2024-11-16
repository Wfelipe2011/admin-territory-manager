"use client"
import { ChartNoAxesColumn, LogOut, Map } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { useAuth } from "@/context/AuthContext"

const items = [
    {
        title: "Início",
        url: "/dashboard",
        icon: ChartNoAxesColumn,
    },
    {
        title: "Gestão de Territórios",
        url: "/gestao",
        icon: Map,
    },
]

export function AppSidebar() {
    const { logout } = useAuth()
    return (
        <Sidebar collapsible="icon" className="pt-10">
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
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Button onClick={logout} variant={"ghost"} className="flex justify-start gap-3">
                                <LogOut
                                    style={{
                                        width: "1.5rem",
                                        height: "1.5rem"
                                    }}
                                    className="text-primary" />
                                <span className="text-lg">Sair</span>
                            </Button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
