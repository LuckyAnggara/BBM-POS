
'use client';
import type { ReactNode } from 'react';
import React from 'react'; // Import React for useState
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
  SidebarGroupContent,
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

// Internal component to handle state for collapsible items
const NavItemRenderer = ({ item, pathname }: { item: NavItem; pathname: string }) => {
  const isRouteCurrentlyActive = item.isActive ? item.isActive(pathname) : (item.href && pathname === item.href);
  
  // For submenus, determine initial open state based on isInitiallyOpen or if a child route is active.
  // For direct links, isOpen is not applicable/used for collapsing.
  const initialOpenState = item.subItems && item.subItems.length > 0 
    ? (item.isInitiallyOpen || isRouteCurrentlyActive) 
    : false;
  const [isOpen, setIsOpen] = React.useState(initialOpenState);

  React.useEffect(() => {
    // Effect to re-evaluate isOpen if isInitiallyOpen or isRouteCurrentlyActive changes
    // This is useful if navigation happens and a previously inactive group becomes active
    if (item.subItems && item.subItems.length > 0) {
      const newOpenState = item.isInitiallyOpen || (item.isActive ? item.isActive(pathname) : false);
      // Only update if it's meant to be open due to route or initial config,
      // but don't force close if user manually opened it and route is not active.
      // User clicks should take precedence for toggling.
      // This logic might need refinement based on desired UX for auto-opening/closing on route changes.
      // For now, let's stick to initial open + manual toggle.
      // If route becomes active, it will be set to open by isInitiallyOpen logic on re-render if NavItem key changes, or if we explicitly set it here.
      // Let's ensure it opens if route becomes active and it wasn't already open due to manual toggle.
      if (newOpenState && !isOpen) {
         // setIsOpen(true); // This might be too aggressive, let's rely on initial state and manual toggle.
      }
    }
  }, [pathname, item, isOpen]);


  const handleToggle = () => {
    if (item.subItems && item.subItems.length > 0) {
      setIsOpen(!isOpen);
    }
  };

  if (item.subItems && item.subItems.length > 0) {
    return (
      <SidebarMenuItem 
        key={item.label} 
        className="relative"
        data-state={isOpen ? 'open' : 'closed'} // This drives the animation
      >
        <SidebarMenuButton
          className="justify-between"
          asChild={false}
          isActive={isRouteCurrentlyActive} // For highlighting based on route
          onClick={handleToggle} // Handles opening/closing submenu
          tooltip={{ content: item.label, side: 'right', align: 'center' }}
        >
          <span className="flex items-center gap-2">
            <item.icon />
            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/menu-item:rotate-180 group-data-[collapsible=icon]:hidden" />
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

  // For items without subItems
  return (
    <SidebarMenuItem key={item.href || item.label}>
      <Link href={item.href || '#'} legacyBehavior passHref>
        <SidebarMenuButton
          isActive={isRouteCurrentlyActive}
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
                  {group.items.map(item => <NavItemRenderer key={item.label} item={item} pathname={pathname} />)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          {standaloneNavItems.length > 0 && (
            <>
              <SidebarSeparator className="my-2" />
              <SidebarMenu className="gap-0.5 px-2">
                {standaloneNavItems.map(item => <NavItemRenderer key={item.label} item={item} pathname={pathname} />)}
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
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
