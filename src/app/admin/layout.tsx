import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Users, Package, Settings, ChevronRight } from 'lucide-react';
// import { usePathname } from 'next/navigation'; // Client component needed for this
// For server component, we manage active state differently or pass it down.

// This is a server component, so usePathname won't work directly here.
// If complex active state logic is needed, this could be a client component,
// or active state can be inferred by child page components.

const adminNavItems = [
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/products', label: 'Product Catalog', icon: Package },
  { href: '/admin/settings', label: 'System Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  // const pathname = usePathname(); // This line makes it a Client Component
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h1 className="text-3xl font-headline font-semibold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage system settings, users, and application data.</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-[280px_1fr] gap-6 items-start">
        <Card className="sticky top-[calc(var(--header-height,56px)+theme(spacing.6))]"> {/* Adjust top based on header height */}
          <CardContent className="p-4">
            <nav className="flex flex-col gap-1">
              {adminNavItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  // data-active={pathname === item.href} // Requires client component for pathname
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ))}
            </nav>
          </CardContent>
        </Card>
        <div className="min-w-0"> {/* This div is important for flexbox/grid item to not overflow */}
          {children}
        </div>
      </div>
    </div>
  );
}
