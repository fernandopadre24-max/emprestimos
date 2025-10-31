"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Home, Users, Landmark, FileText, Settings, Banknote } from "lucide-react"
import { Logo } from "@/components/icons"
import { cn } from "@/lib/utils"

const MainSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/emprestimos", label: "Empréstimos", icon: Landmark },
    { href: "/banco", label: "Bancos", icon: Banknote },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/relatorios", label: "Relatórios", icon: FileText },
  ]

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
            <Logo className="w-6 h-6 text-primary" />
            <span className={cn("font-bold text-lg font-headline group-data-[collapsible=icon]:hidden")}>CredSimples</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton asChild tooltip={{ children: "Configurações" }} isActive={pathname === "/settings"}>
                <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default MainSidebar;
