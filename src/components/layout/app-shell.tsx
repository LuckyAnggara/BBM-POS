
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
  SlidersHorizontal,
  Building,
  Home, // Added for Admin Overview consistency if needed
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
      { href: '/admin', label: 'Overview', icon: Home }, 
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/settings', label: 'System Settings', icon: Settings },
    ],
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="flex flex-col" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden">StockPilot</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-0">
          <SidebarMenu className="gap-1 p-2">
            {navItems.map((item) =>
              item.subItems ? (
                <SidebarMenuItem key={item.label} className="relative">
                  <SidebarMenuButton
                    className="justify-between"
                    asChild={false} 
                    isActive={item.subItems.some(sub => pathname === sub.href || (pathname && sub.href !== '/admin' && pathname.startsWith(sub.href)) || (sub.href === '/admin' && pathname === '/admin') || (sub.href === '/admin' && pathname.startsWith('/admin/')))}
                    tooltip={{content: item.label, side: 'right', align: 'center' }}
                  >
                    <span className="flex items-center gap-2">
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {item.subItems.map((subItem) => (
                      <SidebarMenuItem key={subItem.href}>
                        <Link href={subItem.href} legacyBehavior passHref>
                          <SidebarMenuSubButton
                            asChild={false} // SidebarMenuSubButton renders <a> by default
                            isActive={pathname === subItem.href || (subItem.href === '/admin' && pathname.startsWith('/admin/'))}
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
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      asChild={true} // Changed to true
                      tooltip={{content: item.label, side: 'right', align: 'center' }}
                    >
                      <a> {/* Added <a> wrapper for icon and span */}
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </a>
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
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium text-sidebar-foreground">Admin User</span>
              <span className="text-xs text-sidebar-foreground/70">admin@stockpilot.com</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              <LogOut className="h-5 w-5" />
            </Button>
             <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:flex hidden"> {/* Show only when icon */}
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-sm">
            <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

