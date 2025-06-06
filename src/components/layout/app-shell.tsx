
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronDown, LogOut, Building, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { sidebarNavGroups, standaloneNavItems, type NavItem, type NavSubItem } from './nav-items';

interface AppShellProps {
  children: ReactNode;
}

const renderNavItem = (item: NavItem, pathname: string): ReactNode => {
  const isActiveRoute = item.isActive ? item.isActive(pathname) : (item.href && pathname === item.href);

  if (item.subItems && item.subItems.length > 0) {
    return (
      <SidebarMenuItem key={item.label} className="relative">
        <SidebarMenuButton
          className="justify-between"
          asChild={false}
          isActive={isActiveRoute || item.isInitiallyOpen} // isActive also controls open state for submenus
          tooltip={{ content: item.label, side: 'right', align: 'center' }}
        >
          <span className="flex items-center gap-2">
            <item.icon />
            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden" />
        </SidebarMenuButton>
        <SidebarMenuSub>
          {item.subItems.map((subItem) => (
            <SidebarMenuItem key={subItem.href || subItem.label}>
              <Link href={subItem.href || '#'} legacyBehavior passHref>
                <SidebarMenuSubButton
                  asChild={false}
                  isActive={subItem.isActive ? subItem.isActive(pathname) : pathname === subItem.href}
                >
                  {subItem.icon && <subItem.icon className="size-3.5" />}
                  {subItem.label}
                </SidebarMenuSubButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem key={item.href || item.label}>
      <Link href={item.href || '#'} legacyBehavior passHref>
        <SidebarMenuButton
          isActive={isActiveRoute}
          asChild={true}
          tooltip={{ content: item.label, side: 'right', align: 'center' }}
        >
          <a>
            <item.icon />
            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
          </a>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="flex flex-col" collapsible="icon" variant="sidebar">
        <SidebarHeader className="p-3 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2.5">
            {/* Placeholder for a more elaborate logo like Acme Inc. */}
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                 <Building className="h-5 w-5" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <h1 className="text-base font-semibold leading-tight font-headline">StockPilot</h1>
                <span className="text-xs text-muted-foreground leading-tight">Enterprise</span>
            </div>
          </Link>
        </SidebarHeader>
        
        <SidebarContent className="flex-1 p-0">
          {sidebarNavGroups.map((group) => (
            <SidebarGroup key={group.groupTitle} className="pt-3 pb-1 px-2">
              <SidebarGroupLabel className="text-xs px-2 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                {group.groupTitle}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map(item => renderNavItem(item, pathname))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          {standaloneNavItems.length > 0 && (
            <>
              <SidebarSeparator className="my-2" />
              <SidebarMenu className="gap-0.5 px-2">
                {standaloneNavItems.map(item => renderNavItem(item, pathname))}
              </SidebarMenu>
            </>
          )}
        </SidebarContent>
        
        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/80x80/7F56D9/FFFFFF.png?text=AU" alt="Admin User" data-ai-hint="user initial" />
              <AvatarFallback>AU</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium text-sidebar-foreground leading-tight">Admin User</span>
              <span className="text-xs text-sidebar-foreground/70 leading-tight">admin@stockpilot.com</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              <Settings className="h-4 w-4" />
            </Button>
             <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:flex hidden"
                     tooltip={{content: 'User Settings', side: 'right', align: 'center' }}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-sm">
          {/* Main header content - SidebarTrigger is usually here */}
          <SidebarTrigger />
          {/* Breadcrumbs or other header elements can go here */}
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
