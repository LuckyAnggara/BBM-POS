
import type { Metadata } from 'next';
import { Toaster as SonnerToaster } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import './globals.css';
import { getSession } from '@/lib/auth-utils';
import LoginPage from './login/page';
import type { User } from '@/lib/types'; // Import User type

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
  const user = sessionData?.user as User | undefined; // Cast to User or undefined

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {user ? ( // Check if user object exists
            <AppShell user={user}>{children}</AppShell> // Pass user to AppShell
        ) : (
             children
        )}
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
