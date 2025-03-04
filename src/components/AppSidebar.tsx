"use client";
import {
  ChartNoAxesColumn,
  LogOut,
  Map,
  PenBox,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

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
  {
    title: "Cadastros",
    url: "/cadastro/territorio",
    icon: PenBox,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="">
      <SidebarContent>
        <SidebarMenu>
          <SidebarTrigger />
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url} className="h-10 w-10 ml-1 mt-2">
                  <item.icon
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                    }}
                    className="text-primary"
                  />
                  <span className="text-lg">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <FooterSidebar />
    </Sidebar>
  );
}

function FooterSidebar() {
  const { logout } = useAuth();
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Button
              onClick={logout}
              variant={"ghost"}
              className="flex justify-start gap-3"
            >
              <LogOut
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                }}
                className="text-primary"
              />
              <span className="text-lg">Sair</span>
            </Button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
