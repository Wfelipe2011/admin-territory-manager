"use client";
import {
  ChartNoAxesColumn,
  LogOut,
  Map,
  MapPinHouse,
  MapPinPlusInside,
  HousePlus,
  MapPinPlus,
  ChevronDown,
  PenBox,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Collapsible } from "@radix-ui/react-collapsible";
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
];

const itemsRegister = [
  {
    title: "Território",
    url: "/cadastro/territorio",
    icon: MapPinPlusInside,
  },
  {
    title: "Quadra",
    url: "/cadastro/quadra",
    icon: MapPinHouse,
  },
  {
    title: "Rua",
    url: "/cadastro/rua",
    icon: MapPinPlus,
  },
  {
    title: "Casa",
    url: "/cadastro/casa",
    icon: HousePlus,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="pt-10">
      <SidebarContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url} className="flex gap-3 my-1">
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
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="!text-sidebar-foreground hover:!text-sidebar-accent-foreground w-full">
                <SidebarMenuItem className="flex w-full justify-between items-center gap-3 my-1">
                  <PenBox
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                    }}
                    className="text-primary"
                  />
                  <span className="text-lg">Cadastro</span>
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuItem>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  {itemsRegister.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url} className="my-1 pl-4">
                          <span className="text-lg">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>
            </CollapsibleContent>
          </Collapsible>
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
