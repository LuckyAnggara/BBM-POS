
'use client';

import React, { type ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarTrigger,
  SidebarGroupLabel,
  useSidebar, 
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator} from '@/components/ui/separator'

import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link'; 
import { usePathname } from 'next/navigation';
import { TeamSwitcher } from './team-switcher';
import { NavUser } from './nav-user';
// User prop and type import removed as authentication is removed.
// import type { User } from '@/lib/types'; 
import { sidebarNavGroups, standaloneNavItems, type NavItem, type NavSubItem } from './nav-items.tsx'; 
import { PageTitleProvider, useCurrentPageTitle } from './page-title-context';

interface AppShellProps {
  children: ReactNode;
  // user prop removed
}

const shopData = {
  name: 'StockPilot POS',
};


function NavItemDisplay({ item, pathname }: { item: NavItem; pathname: string }) {
  const { isMobile } = useSidebar(); 

  const isActive = item.isActive ? item.isActive(pathname) : 
                  item.subItems?.some(sub => sub.isActive ? sub.isActive(pathname) : pathname === sub.href);

  if (item.subItems && item.subItems.length > 0) {
    return (
      <Collapsible defaultOpen={item.isInitiallyOpen || isActive}>
        <SidebarMenuItem className="group/menu-item">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.label} data-active={isActive}>
              <item.icon />
              <span>{item.label}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/menu-item:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.subItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton asChild data-active={subItem.isActive ? subItem.isActive(pathname) : pathname === subItem.href}>
                    <Link href={subItem.href}>
                      {subItem.icon && <subItem.icon />}
                      <span>{subItem.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.label} data-active={item.isActive ? item.isActive(pathname) : pathname === item.href}>
        <Link href={item.href || '#'}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Inner component to consume context
function AppShellLayout({ children }: AppShellProps) { // user prop removed
  const pathname = usePathname();
  const pageTitle = useCurrentPageTitle();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          {/* @ts-ignore */}
          <TeamSwitcher shop={shopData} />
        </SidebarHeader>
        <SidebarContent>
          {sidebarNavGroups.map((group) => (
            <SidebarGroup key={group.groupTitle}>
              <SidebarGroupLabel>{group.groupTitle}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavItemDisplay key={item.label} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
           <SidebarGroup>
            <SidebarGroupLabel>Apps & Tools</SidebarGroupLabel>
            <SidebarMenu>
                {standaloneNavItems.map((item) => (
                     <NavItemDisplay key={item.label} item={item} pathname={pathname} />
                ))}
            </SidebarMenu>
           </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser /> {/* NavUser no longer receives user prop */}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 sticky top-0 z-30">
          <div className="flex items-center"> 
            <SidebarTrigger className="-ml-1" /> 
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-6" 
            />
          </div>
          {pageTitle && <h1 className="text-xl font-semibold font-headline truncate">{pageTitle}</h1>}
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-muted/30">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


export function AppShell({ children }: AppShellProps) { // user prop removed
  return (
    <PageTitleProvider>
      <AppShellLayout>{children}</AppShellLayout> {/* user prop removed */}
    </PageTitleProvider>
  );
}
