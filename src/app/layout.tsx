import './globals.css';
import type { Metadata } from 'next';
import { Toaster as SonnerToaster } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar';
import { getSession } from '@/lib/auth-utils';
import type { User } from '@/lib/types';

export const metadata: Metadata = {
  title: 'StockPilot',
  description: 'Inventory Management, POS, and Purchasing',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionData = await getSession();
  const user = sessionData?.user as User | undefined;

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
        {user ? (
          <SidebarProvider>
            <AppShell user={user}>
              {children}
              <SidebarTrigger className="-ml-1" />
              <SonnerToaster richColors position="top-right" />
            </AppShell>
          </SidebarProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
