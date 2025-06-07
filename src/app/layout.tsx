
import './globals.css';
import type { Metadata } from 'next';
import { Toaster as SonnerToaster } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { SidebarProvider } from '@/components/ui/sidebar';
// getUserSession can be imported if needed directly in RootLayout for AppShell props
// import { getUserSession, type UserSessionData } from '@/lib/user-session';

export const metadata: Metadata = {
  title: 'StockPilot',
  description: 'Inventory Management, POS, and Purchasing',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // With custom auth, session data might be fetched here if AppShell needs it directly
  // const userSession: UserSessionData | null = await getUserSession();

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
        <SidebarProvider>
          {/* AppShell might need userSession prop if it uses it directly */}
          <AppShell> 
            {children}
            <SonnerToaster richColors position="top-right" />
          </AppShell>
        </SidebarProvider>
      </body>
    </html>
  );
}

    