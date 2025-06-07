
"use client"

import {
  ChevronsUpDown,
  LogOut,
  UserCircle as UserIcon,
  LogIn,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react";
import { getSessionDataFromServer, logoutUser } from "@/app/(auth)/login/actions"; // Corrected import path
import type { UserSessionData } from "@/lib/user-session";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [session, setSession] = useState<UserSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This effect runs client-side.
  // To get session data, we'd ideally pass it from a server component
  // or make a client-side API call if cookies are httpOnly.
  // For this example, we'll try to fetch it (though getSessionDataFromServer is a server action).
  // A better approach for NavUser as a client component would be an API route.
  // However, since `getSessionDataFromServer` uses `cookies()`, it *must* run on the server.
  // So, NavUser should ideally be a Server Component or receive session as prop.
  // Forcing a re-render via router.refresh() after login/logout is key.

  // This is a placeholder to show how you might fetch/display user info.
  // In a real app, you'd get this from context or props if NavUser is deeply nested.
  useEffect(() => {
    async function fetchSession() {
      setIsLoading(true);
      // Calling a server action from a client component like this is fine.
      const serverSession = await getSessionDataFromServer();
      setSession(serverSession);
      setIsLoading(false);
    }
    fetchSession();
  }, []);


  const handleLogout = async () => {
    await logoutUser();
    // router.refresh() will be called by redirect in logoutUser server action.
  };

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
           <SidebarMenuButton size="lg" className="animate-pulse">
             <Avatar className="h-8 w-8 rounded-lg bg-muted" />
             <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium w-20 h-4 bg-muted rounded"></span>
                <span className="truncate text-xs text-muted-foreground w-16 h-3 bg-muted rounded mt-1"></span>
              </div>
           </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }


  if (!session) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Link href="/login" passHref legacyBehavior>
            <SidebarMenuButton size="lg" as="a">
              <LogIn className="mr-2 h-5 w-5" />
              Login
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const fallbackName = session.userName ? session.userName.charAt(0).toUpperCase() : "U";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {/* <AvatarImage src={user.avatarUrl || undefined} alt={user.name || "User"} /> */}
                <AvatarFallback className="rounded-lg bg-muted">{fallbackName}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{session.userName}</span>
                <span className="truncate text-xs text-muted-foreground">{session.userEmail || 'No email'}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-muted">{fallbackName}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{session.userName}</span>
                  <span className="truncate text-xs text-muted-foreground">{session.userEmail || 'No email'}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Add other items like "Profile", "Settings" if needed */}
            {/* <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/profile"><UserIcon className="mr-2 h-4 w-4" /> Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator /> */}
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
