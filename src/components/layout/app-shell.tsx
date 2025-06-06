'use client';

import React, { type ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail
} from '@/components/ui/sidebar';

import {
  SquareTerminal,
  Bot,
  DollarSign,
  Settings2,
  ShoppingCart,
  ShoppingBag,
  Map,
  Building
} from 'lucide-react';

import { usePathname } from 'next/navigation';
import { TeamSwitcher } from './team-switcher';
import { NavUser } from './nav-user';
import { NavMain } from './nav-main';
import type { User } from '@/lib/types';

interface AppShellProps {
  children: ReactNode;
  user: User;
}

const data = {
  shop: {
    name: 'PoS Ku',
    logo: Building
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: SquareTerminal,
    },
    {
      title: 'Inventory',
      url: '#',
      icon: Bot,
      items: [
        {
          title: 'All Products',
          url: '/inventory',
        },
        {
          title: 'Add New Product',
          url: '/inventory/add',
        },
      ],
    },
    {
      title: 'Sales',
      url: '#',
      icon: DollarSign,
      items: [
        {
          title: 'Sales History',
          url: '/sales/history',
        },
      ],
    },
    {
      title: 'Settings',
      url: '/admin/settings',
      icon: Settings2,
    },
  ],
  subNav: [
    {
      name: 'Point of Sale',
      url: '/pos',
      icon: ShoppingCart,
    },
    {
      name: 'Purchasing',
      url: '/purchasing',
      icon: ShoppingBag,
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map,
    },
  ],
};

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <TeamSwitcher shop={data.shop} />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <main className="flex-1 overflow-auto">{children}</main>
    </SidebarProvider>
  );
}
