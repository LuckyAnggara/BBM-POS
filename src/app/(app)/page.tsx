
'use client';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Users, Warehouse, ClipboardList } from "lucide-react";
import { useInventoryStore } from "@/store/inventory-store";
import { useCartStore } from "@/store/cart-store"; 
import { usePageTitle } from '@/components/layout/page-title-context'; // Import the hook

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
}

function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-headline">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  usePageTitle('Dashboard'); // Set the page title
  const { products, fetchProducts, isLoading: inventoryLoading } = useInventoryStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const safeProducts = products || [];
  const totalProducts = safeProducts.length;
  const totalStockQuantity = safeProducts.reduce((sum, p) => sum + p.quantity, 0);
  const totalStockValue = safeProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  const totalSalesToday = 1250.75;
  const pendingOrders = 5;


  return (
    <div className="flex flex-col gap-6">
      {/* The h1 title is now rendered in AppShell header */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue (Today)"
          value={`$${totalSalesToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="+20.1% from last month"
        />
        <StatCard
          title="Total Products"
          value={inventoryLoading ? "Loading..." : totalProducts.toString()}
          icon={Package}
          description="Number of unique SKUs"
        />
        <StatCard
          title="Total Stock Quantity"
          value={inventoryLoading ? "Loading..." : totalStockQuantity.toLocaleString()}
          icon={Warehouse}
          description="Sum of all product quantities"
        />
         <StatCard
          title="Pending Purchase Orders"
          value={pendingOrders.toString()}
          icon={ClipboardList}
          description="Awaiting fulfillment"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display yet.</p>
            {/* Placeholder for recent activity feed */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
          {inventoryLoading ? <p>Loading...</p> : 
            (safeProducts || []).filter(p => p.lowStockThreshold && p.quantity < p.lowStockThreshold).length > 0 ? (
              <ul className="space-y-2">
                {(safeProducts || []).filter(p => p.lowStockThreshold && p.quantity < p.lowStockThreshold).slice(0,5).map(p => (
                  <li key={p.id} className="text-sm flex justify-between">
                    <span>{p.name}</span>
                    <span className="font-semibold text-destructive">{p.quantity} left</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">All products are well-stocked.</p>
            )
          }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
