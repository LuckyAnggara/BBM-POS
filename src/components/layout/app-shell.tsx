
'use client';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react'; 
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
  Home,
  ListTree, 
} from 'lucide-react'; // Removed Loader2 as it's no longer used here
import { usePathname } from 'next/navigation';
// Removed: import { fetchAllCategoriesAction } from '@/app/inventory/actions';
// Removed: import type { Category } from '@/lib/types'; 

interface AppShellProps {
  children: ReactNode;
}

interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  subItems?: NavItem[];
}


const baseNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Inventory', 
    icon: Warehouse,
    subItems: [ 
        { href: '/inventory', label: 'All Products', icon: Package }
    ]
  },
  { href: '/pos', label: 'Point of Sale', icon: ShoppingCart },
  { href: '/purchasing', label: 'Purchasing', icon: ShoppingBag },
  {
    label: 'Admin',
    icon: SlidersHorizontal,
    subItems: [
      { href: '/admin', label: 'Overview', icon: Home },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/products', label: 'Product Catalog', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: ListTree },
      { href: '/admin/settings', label: 'System Settings', icon: Settings },
    ],
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  // Removed useState for navItems and isLoadingCategories

  // Removed useEffect that fetched categories

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
            {baseNavItems.map((item) => // Use baseNavItems directly
              item.subItems && item.subItems.length > 0 ? ( 
                <SidebarMenuItem key={item.label} className="relative">
                  <SidebarMenuButton
                    className="justify-between"
                    asChild={false}
                    isActive={
                        (item.href && pathname === item.href) || 
                        item.subItems.some(sub => pathname === sub.href || (sub.href && sub.href !== '/' && pathname.startsWith(sub.href)))
                    }
                    tooltip={{content: item.label, side: 'right', align: 'center' }}
                  >
                    <span className="flex items-center gap-2">
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {/* Removed dynamic category loading indicator */}
                    {item.subItems.map((subItem) => (
                      <SidebarMenuItem key={subItem.href || subItem.label}>
                        <Link href={subItem.href || '#'} legacyBehavior passHref>
                          <SidebarMenuSubButton
                            asChild={false}
                            isActive={pathname === subItem.href || (item.label === 'Admin' && subItem.href === '/admin' && pathname.startsWith('/admin'))}
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
                <SidebarMenuItem key={item.href || item.label}>
                  <Link href={item.href || '#'} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      asChild={true}
                      tooltip={{content: item.label, side: 'right', align: 'center' }}
                    >
                      <a>
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
             <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:flex hidden"> 
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
