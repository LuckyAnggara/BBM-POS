
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Users, Package, Settings, Activity, ListTree, WalletCards } from "lucide-react"; // Added WalletCards
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePageTitle } from '@/components/layout/page-title-context';

export default function AdminOverviewPage() {
  usePageTitle('Admin Overview');
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Admin Overview</CardTitle>
          <CardDescription>Welcome to the StockPilot Admin Panel. Here you can manage various aspects of the application.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/users" legacyBehavior passHref>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Management</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Manage all user accounts, roles, and permissions.</p>
                <Button variant="link" className="p-0 h-auto mt-2 text-sm">Go to Users &rarr;</Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/products" legacyBehavior passHref>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Product Catalog</CardTitle>
                <Package className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Oversee all products, categories, and supplier details.</p>
                 <Button variant="link" className="p-0 h-auto mt-2 text-sm">Go to Products &rarr;</Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/categories" legacyBehavior passHref>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Product Categories</CardTitle>
                <ListTree className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Define and organize product categories.</p>
                 <Button variant="link" className="p-0 h-auto mt-2 text-sm">Go to Categories &rarr;</Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/expenses/categories" legacyBehavior passHref>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expense Categories</CardTitle>
                <WalletCards className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Define and manage expense categories.</p>
                 <Button variant="link" className="p-0 h-auto mt-2 text-sm">Go to Expense Categories &rarr;</Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/settings" legacyBehavior passHref>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Settings</CardTitle>
                <Settings className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Configure application-wide settings and preferences.</p>
                <Button variant="link" className="p-0 h-auto mt-2 text-sm">Go to Settings &rarr;</Button>
              </CardContent>
            </Card>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-green-500"/>
            <span>All systems operational.</span>
          </div>
          {/* Placeholder for more system health metrics */}
        </CardContent>
      </Card>
    </div>
  );
}
    
