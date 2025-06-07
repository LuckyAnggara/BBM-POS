
import './globals.css';
import type { Metadata } from 'next';
import { Toaster as SonnerToaster } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { SidebarProvider } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'StockPilot',
  description: 'Inventory Management, POS, and Purchasing',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Authentication logic (auth(), session, user) has been removed.
  // AppShell no longer receives a user prop from here.
  // NavUser component will need to be adjusted or will display a generic state.

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
        {/* NextAuthSessionProvider has been removed */}
        <SidebarProvider>
          <AppShell> {/* AppShell no longer receives user prop here */}
            {children}
            <SonnerToaster richColors position="top-right" />
          </AppShell>
        </SidebarProvider>
      </body>
    </html>
  );
}
