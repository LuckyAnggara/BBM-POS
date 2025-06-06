
import type { Metadata } from 'next';
import { Toaster as SonnerToaster } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import './globals.css';
import { getSession } from '@/app/auth/actions'; // Import getSession
import LoginPage from './login/page'; // Import login page for conditional rendering

export const metadata: Metadata = {
  title: 'StockPilot',
  description: 'Inventory Management, POS, and Purchasing',
};

export default async function RootLayout({ // Make RootLayout an async component
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession(); // Check session on the server

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {/* 
          Middleware handles redirection. AppShell should only be rendered for authenticated routes.
          The login page needs its own layout, or AppShell needs to be smart enough not to render sidebar for /login.
          However, with middleware, if not authenticated, user will be redirected to /login,
          and /login won't be wrapped by this AppShell if middleware is set up correctly.
          If /login page is requested and user is not authenticated, middleware allows it, but this layout will still wrap it.
          To avoid AppShell on /login, we need to conditionally render it based on path or have separate layouts.
          For now, let's assume middleware redirects and login page is not using AppShell.
          If current path is /login, don't render AppShell.
        */}
        {session ? (
            <AppShell>{children}</AppShell>
        ) : (
            // If no session, and middleware didn't redirect (e.g. on first load of /login)
            // render children directly (which would be LoginPage)
             children 
        )}
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
