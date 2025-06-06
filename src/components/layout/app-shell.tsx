
'use client';

import React, { type ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar, // Import useSidebar
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"


import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link'; // Import Link
import { usePathname } from 'next/navigation';
import { TeamSwitcher } from './team-switcher';
import { NavUser } from './nav-user';
import type { User } from '@/lib/types';
import { sidebarNavGroups, standaloneNavItems, type NavItem, type NavSubItem } from './nav-items.tsx'; // Import nav items configuration, ensure .tsx

interface AppShellProps {
  children: ReactNode;
  user: User;
}

// Dummy shop data for TeamSwitcher, replace with actual data if needed
const shopData = {
  name: 'StockPilot POS',
  // logo: BuildingIcon, // Assuming BuildingIcon is defined or imported
};


function NavItemDisplay({ item, pathname }: { item: NavItem; pathname: string }) {
  const { isMobile } = useSidebar(); // Access sidebar context

  // Determine if item is active based on its own isActive or subItems' isActive
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


export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();

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
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      {/* Main content area, ensuring it takes up remaining space and is scrollable if needed */}
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-muted/30">
        {children}
      </main>
    </SidebarProvider>
  );
}
