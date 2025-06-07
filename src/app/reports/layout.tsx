
'use client';
import { AppShell } from '@/components/layout/app-shell';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { BarChart3, FileText } from 'lucide-react';

const reportNavItems = [
  { href: '/reports/income-statement', label: 'Income Statement', icon: FileText },
  // Add more report links here in the future
  // { href: '/reports/sales-summary', label: 'Sales Summary', icon: BarChart3 },
];

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header for reports section moved to PageTitleProvider via usePageTitle in specific report pages */}
        {/* Report-specific sub-navigation can remain if needed, or be part of AppShell's main nav */}
        <div className="grid md:grid-cols-[280px_1fr] gap-6 items-start">
          <Card className="sticky top-[calc(var(--header-height,56px)+theme(spacing.6))] print:hidden">
            <CardContent className="p-4">
              <nav className="flex flex-col gap-1">
                {reportNavItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    // data-active={pathname === item.href} // Requires client component or hook for pathname
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  </Link>
                ))}
              </nav>
            </CardContent>
          </Card>
          <div className="min-w-0">
            {children}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
