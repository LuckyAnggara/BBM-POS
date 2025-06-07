
import './globals.css';
import type { Metadata } from 'next';
import { Toaster as SonnerToaster } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@/lib/auth'; // Import auth from NextAuth config
import NextAuthSessionProvider from '@/components/providers/session-provider'; // Renamed component
import type { User as AppUserType } from '@/lib/types'; // Your application's User type

export const metadata: Metadata = {
  title: 'StockPilot',
  description: 'Inventory Management, POS, and Purchasing',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth(); // Fetch session on the server
  // Cast NextAuth user to your application's User type if necessary
  // Ensure your NextAuth callbacks (jwt, session) populate all needed fields
  const user = session?.user as (AppUserType & { id: string; role?: string | null; isActive?: boolean; image?: string | null }) | undefined;

  const appShellUserProps = user ? {
    id: user.id,
    name: user.name ?? 'User',
    email: user.email ?? '',
    role: user.role ?? 'STAFF',
    avatarUrl: user.image,
    isActive: Boolean(user.isActive), // Ensure isActive is a boolean
    // These might not be directly available from NextAuth session user
    // Ensure your callbacks populate them if they are strictly needed by AppShell
    // Or make them optional in AppShell's user prop type.
    // createdAt: user.createdAt || new Date().toISOString(), 
    // updatedAt: user.updatedAt || new Date().toISOString(),
    // lastLogin: user.lastLogin || null,
  } : undefined;


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <NextAuthSessionProvider session={session}> {/* Pass server session to provider */}
          {appShellUserProps ? (
            <SidebarProvider>
              <AppShell user={appShellUserProps as any /* Cast if AppShell expects more fields not in session */}>
                {children}
                <SonnerToaster richColors position="top-right" />
              </AppShell>
            </SidebarProvider>
          ) : (
            <>
              {children}
              {/* SonnerToaster can also be here for login page toasts if needed */}
              <SonnerToaster richColors position="top-right" />
            </>
          )}
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
