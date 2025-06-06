"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Package,
  Bot,
  DollarSign,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  SquareTerminal,
  Building,
} from "lucide-react"
import { ChevronRight, type LucideIcon } from "lucide-react"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {TeamSwitcher} from './team-switcher'

// This is sample data.
const data = {
    shop:{
        name: "PoS Ku",
        logo : Building
    },
  navMain: [
    {
      title: "Dashboard",
      url:  '/',
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Inventory",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "All Products",
          url: "/inventory",
        },
        {
          title: "Add New Product",
          url: "/inventory/add",      
        },
      ],
    },
    {
      title: "Sales",
      url: "#",
      icon: DollarSign,
      items: [
        {
          title: 'Sales History',
          url: '/sales/history',
        },
      ],
    },
    {
      title: "Settings",
      url: '/admin/settings',
      icon: Settings2,
    },
  ],

  subNav: [
    {
      name: "Point of Sale",
      url: '/pos',
      icon: ShoppingCart,
    },
    {
      name: "Purchasing",
      url: "/purchasing",
      icon: ShoppingBag,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher shop={data.shop} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
