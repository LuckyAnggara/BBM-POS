
'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Eye, Filter, Search, MoreHorizontal, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PurchaseOrder } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventoryStore } from '@/store/inventory-store';

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1',
    poNumber: 'PO2024-001',
    supplierId: 'sup1',
    supplierName: 'Fresh Farms Inc.',
    orderDate: new Date('2024-07-15').toISOString(),
    expectedDeliveryDate: new Date('2024-07-20').toISOString(),
    status: 'Received',
    items: [
      { productId: '1', productName: 'Organic Apples', quantityOrdered: 50, unitCost: 1.50, totalCost: 75.00, quantityReceived: 50 },
    ],
    totalAmount: 75.00,
    createdBy: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po2',
    poNumber: 'PO2024-002',
    supplierId: 'sup2',
    supplierName: 'Artisan Bakers Co.',
    orderDate: new Date('2024-07-18').toISOString(),
    expectedDeliveryDate: new Date('2024-07-25').toISOString(),
    status: 'Ordered',
    items: [
      { productId: '2', productName: 'Whole Wheat Bread', quantityOrdered: 30, unitCost: 2.20, totalCost: 66.00 },
    ],
    totalAmount: 66.00,
    createdBy: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po3',
    poNumber: 'PO2024-003',
    supplierId: 'sup1',
    supplierName: 'Fresh Farms Inc.',
    orderDate: new Date('2024-07-20').toISOString(),
    status: 'Pending Approval',
    items: [
      { productId: '1', productName: 'Organic Apples', quantityOrdered: 20, unitCost: 1.50, totalCost: 30.00 },
      { productId: '3', productName: 'Free-Range Eggs', quantityOrdered: 10, unitCost: 3.00, totalCost: 30.00 },
    ],
    totalAmount: 60.00,
    createdBy: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const statusColors: Record<PurchaseOrder['status'], string> = {
  'Draft': 'bg-gray-200 text-gray-700',
  'Pending Approval': 'bg-yellow-200 text-yellow-800',
  'Approved': 'bg-blue-200 text-blue-800',
  'Ordered': 'bg-indigo-200 text-indigo-800',
  'Shipped': 'bg-purple-200 text-purple-800',
  'Partially Received': 'bg-orange-200 text-orange-800',
  'Received': 'bg-green-200 text-green-800',
  'Cancelled': 'bg-red-200 text-red-800',
  'Closed': 'bg-gray-400 text-gray-900',
};


export default function PurchasingPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders); // Initialize with mock data
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { increaseStock, fetchProducts: fetchInventoryProducts } = useInventoryStore();

  useEffect(() => {
    // Simulate API call for POs if needed, for now just use mock
    // If POs were fetched, setIsLoading would be set accordingly
    fetchInventoryProducts(); // Ensure inventory products are loaded for stock updates
    setIsLoading(false); // Assuming POs are loaded or mock is used
  }, [fetchInventoryProducts]);

  const filteredPurchaseOrders = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleDeletePO = (poId: string) => {
     toast.warning('Are you sure you want to delete this purchase order?', {
      action: {
        label: 'Delete',
        onClick: () => {
          setPurchaseOrders(prev => prev.filter(po => po.id !== poId));
          // Also update mockPurchaseOrders if it's the source of truth for the session
          const mockIndex = mockPurchaseOrders.findIndex(p => p.id === poId);
          if (mockIndex !== -1) mockPurchaseOrders.splice(mockIndex, 1);
          toast.success('Purchase order deleted.');
        },
      },
      cancel: {
        label: 'Cancel',
      }
    });
  }

  const handleReceivePO = async (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) {
      toast.error("Purchase Order not found.");
      return;
    }

    if (['Received', 'Cancelled', 'Closed'].includes(po.status)) {
      toast.info(`PO ${po.poNumber} is already ${po.status.toLowerCase()} and cannot be received again.`);
      return;
    }

    try {
      // Increase stock for each item in the PO
      for (const item of po.items) {
        await increaseStock(item.productId, item.quantityOrdered);
        // Optionally update item.quantityReceived here if your PO model supports it
      }

      // Update PO status locally
      setPurchaseOrders(prevPOs =>
        prevPOs.map(p =>
          p.id === poId ? { ...p, status: 'Received', updatedAt: new Date().toISOString() } : p
        )
      );
      // Update mockPurchaseOrders array as well
      const mockIndex = mockPurchaseOrders.findIndex(p => p.id === poId);
      if (mockIndex !== -1) {
        mockPurchaseOrders[mockIndex] = { ...mockPurchaseOrders[mockIndex], status: 'Received', updatedAt: new Date().toISOString()};
         // Update quantityReceived for items in mockPurchaseOrders for consistency if needed
        mockPurchaseOrders[mockIndex].items.forEach(item => {
            item.quantityReceived = item.quantityOrdered;
        });
      }


      toast.success(`Items for PO ${po.poNumber} received and stock updated.`);
    } catch (error) {
      toast.error("Failed to update stock. Please check console for errors.");
      console.error("Error receiving PO:", error);
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-semibold">Purchase Orders</h1>
          <p className="text-muted-foreground">Create, manage, and track your purchase orders.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New PO
        </Button>
      </div>

      <Card>
        <CardHeader>
           <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by PO number or supplier..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[70px] ml-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-8 w-[30px] mx-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredPurchaseOrders.length === 0 ? (
             <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No purchase orders found.</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or create a new purchase order.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.supplierName}</TableCell>
                    <TableCell>{format(parseISO(po.orderDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[po.status] || 'bg-gray-200 text-gray-700'} px-2 py-1 text-xs font-medium rounded-full`}>
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled> {/* Future: Link to PO detail page */}
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled> {/* Future: Link to PO edit page */}
                            <Edit className="mr-2 h-4 w-4" /> Edit PO
                          </DropdownMenuItem>
                           <DropdownMenuItem
                            onClick={() => handleReceivePO(po.id)}
                            disabled={['Received', 'Cancelled', 'Closed'].includes(po.status)}
                          >
                            <PackageCheck className="mr-2 h-4 w-4" /> Mark as Received
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeletePO(po.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete PO
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
