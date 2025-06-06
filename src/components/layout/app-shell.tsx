
'use client';
import type { ReactNode } from 'react';
import React from 'react';
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
  SidebarGroupContent, // Ensure this is imported
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronDown, LogOut, Building, Settings, Power } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { sidebarNavGroups, standaloneNavItems, type NavItem, type NavSubItem } from './nav-items';
import { logoutUser } from '@/app/auth/actions'; // Import the server action

interface AppShellProps {
  children: ReactNode;
}

const NavItemRenderer = ({ item, pathname }: { item: NavItem; pathname: string }) => {
  const isRouteCurrentlyActive = item.isActive ? item.isActive(pathname) : (item.href && pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true));
  
  const initialOpenState = item.subItems && item.subItems.length > 0 
    ? (item.isInitiallyOpen || isRouteCurrentlyActive) 
    : false;
  const [isOpen, setIsOpen] = React.useState(initialOpenState);

  React.useEffect(() => {
    if (item.subItems && item.subItems.length > 0) {
      const newOpenState = item.isInitiallyOpen || (item.isActive ? item.isActive(pathname) : false);
      if (newOpenState && !isOpen && isRouteCurrentlyActive) { 
         setIsOpen(true);
      } else if (!newOpenState && isOpen && !isRouteCurrentlyActive && !item.isInitiallyOpen) {
         // Optional: auto-close if route is no longer active and not set to be initially open
         // setIsOpen(false); 
      }
    }
  }, [pathname, item, isOpen, isRouteCurrentlyActive]);

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
        data-state={isOpen ? 'open' : 'closed'}
      >
        <SidebarMenuButton
          className="justify-between"
          asChild={false}
          isActive={isRouteCurrentlyActive}
          onClick={handleToggle}
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
  // If on login page, don't render AppShell, or render minimal version
  // This logic is now handled by middleware redirecting to /login,
  // so AppShell should only render for authenticated routes.
  // If you want /login to have a different layout, it should not use this AppShell.
  // We can achieve this by making login page its own root layout or by conditional rendering here.
  // For now, assuming middleware protects AppShell routes.

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
           <div className="flex items-center gap-2.5 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/80x80/7F56D9/FFFFFF.png?text=AU" alt="Admin User" data-ai-hint="user initial" />
              <AvatarFallback>AU</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium text-sidebar-foreground leading-tight">Admin User</span> {/* Placeholder, update with real user data later */}
              <span className="text-xs text-sidebar-foreground/70 leading-tight">admin@stockpilot.com</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden" asChild>
                <Link href="/admin/settings"><Settings className="h-4 w-4" /></Link>
            </Button>
             <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:flex hidden"
                     tooltip={{content: 'User Settings', side: 'right', align: 'center' }} asChild>
               <Link href="/admin/settings"><Settings className="h-4 w-4" /></Link>
            </Button>
          </div>
          <form action={logoutUser} className="w-full">
            <Button variant="ghost" type="submit" className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <Power className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0" />
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-sm">
          <SidebarTrigger />
          {/* Future: Breadcrumbs or page title can go here */}
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
