
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export default function RootPage() {
  // This page serves as the landing page for the root path '/'.
  // It should not use hooks like usePageTitle that depend on AppShell's context.
  // The actual dashboard is served by src/app/(app)/dashboard/page.tsx for authenticated users.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/40 p-6 text-center">
      <div className="mb-8">
        {/* You can place a logo here if desired */}
        <svg
          className="mx-auto h-16 w-auto text-primary mb-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          data-ai-hint="application logo"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-3">
          Welcome to StockPilot
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Streamline your inventory, manage sales with our intuitive Point of Sale, and simplify your purchasing process.
        </p>
      </div>

      <div className="space-y-4">
        <Button asChild size="lg" className="text-base px-8 py-6">
          <Link href="/login">
            <LogIn className="mr-2 h-5 w-5" /> Get Started / Login
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          Access your dashboard and manage your business operations.
        </p>
      </div>

      <footer className="absolute bottom-6 text-center w-full text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} StockPilot. All rights reserved.</p>
      </footer>
    </div>
  );
}
