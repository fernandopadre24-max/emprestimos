
"use client"

import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { PlusCircle, Calendar as CalendarIcon, Calculator } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar } from "./ui/calendar"
import { useState } from "react"
import { CalculatorComponent } from "./calculator"
import { ptBR } from "date-fns/locale"
import { ThemeToggle } from "./theme-toggle"
import { usePathname } from 'next/navigation'
import { UserNav } from "./user-nav"

export default function Header() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const pathname = usePathname()
  
  const getBreadcrumb = () => {
    const parts = pathname.split('/').filter(part => part)
    if (parts.length === 0) return 'Dashboard';
    const pageTitle = parts[parts.length - 1];
    // Capitalize first letter and handle special cases
    if (pageTitle === 'novo') return 'Novo Empréstimo';
    return pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);
  }


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">CredSimples</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{getBreadcrumb()}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex items-center gap-2 md:grow-0">
        <Button asChild size="sm" className="h-8 gap-1">
            <Link href="/emprestimos/novo">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Novo Empréstimo
            </span>
            </Link>
        </Button>
         <ThemeToggle />
        <Popover>
            <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
                <CalendarIcon className="h-4 w-4" />
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                locale={ptBR}
            />
            </PopoverContent>
        </Popover>
        <Popover>
            <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
                <Calculator className="h-4 w-4" />
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
            <CalculatorComponent />
            </PopoverContent>
        </Popover>
         <UserNav />
      </div>
    </header>
  )
}
