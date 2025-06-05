'use client';
import type { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LayoutDashboard,
  Warehouse,
  ShoppingCart,
  ShoppingBag,
  Users,
  Settings,
  ChevronDown,
  Package,
  LogOut,
  CreditCard,
  SlidersHorizontal,
  ClipboardList,
  Building,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/pos', label: 'Point of Sale', icon: ShoppingCart },
  { href: '/purchasing', label: 'Purchasing', icon: ShoppingBag },
  {
    label: 'Admin',
    icon: SlidersHorizontal,
    subItems: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="flex flex-col">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-headline font-semibold">StockPilot</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-0">
          <SidebarMenu className="gap-1 p-2">
            {navItems.map((item) =>
              item.subItems ? (
                <SidebarMenuItem key={item.label} className="relative">
                  <SidebarMenuButton
                    className="justify-between"
                    // @ts-ignore TODO: Fix this type issue, Radix CollapsibleTrigger expects a specific type for asChild with button
                    asChild={false} 
                    isActive={item.subItems.some(sub => pathname?.startsWith(sub.href))}
                  >
                    <span className="flex items-center gap-2">
                      <item.icon />
                      {item.label}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {item.subItems.map((subItem) => (
                      <SidebarMenuItem key={subItem.href}>
                        <Link href={subItem.href} legacyBehavior passHref>
                          <SidebarMenuSubButton
                            asChild={false}
                            isActive={pathname === subItem.href}
                          >
                            <subItem.icon className="size-3.5" />
                            {subItem.label}
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton isActive={pathname === item.href} asChild={false}>
                      <item.icon />
                      {item.label}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>SP</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">Admin User</span>
              <span className="text-xs text-sidebar-foreground/70">admin@stockpilot.com</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-sm md:justify-end">
            <SidebarTrigger className="md:hidden" />
             {/* Add any header content here, like search or notifications */}
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
