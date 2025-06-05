
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
import Link from 'next/link';
import { mockPurchaseOrders, purchaseOrderStatusColors } from '@/lib/mock-data'; // Updated import

export default function PurchasingPage() {
  // Initialize state with the imported mockPurchaseOrders
  // Note: For changes from other pages (like create) to reflect without a store,
  // this component might need a way to re-fetch or re-initialize its state.
  // For now, it will show the initial state + any POs added/deleted directly to the mockPurchaseOrders array
  // if this page is re-mounted or if we manage to trigger a re-render based on `mockPurchaseOrders` reference.
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { increaseStock, fetchProducts: fetchInventoryProducts } = useInventoryStore();

  useEffect(() => {
    fetchInventoryProducts(); // Ensure inventory products are loaded for stock updates
    // Set purchaseOrders from the potentially modified mock array
    setPurchaseOrders([...mockPurchaseOrders]); 
    setIsLoading(false);
  }, [fetchInventoryProducts]); // Rerun if fetchInventoryProducts changes, or on mount.

  const filteredPurchaseOrders = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleDeletePO = (poId: string) => {
     toast.warning('Are you sure you want to delete this purchase order?', {
      action: {
        label: 'Delete',
        onClick: () => {
          const indexToDelete = mockPurchaseOrders.findIndex(po => po.id === poId);
          if (indexToDelete > -1) {
            mockPurchaseOrders.splice(indexToDelete, 1);
          }
          setPurchaseOrders(prev => prev.filter(po => po.id !== poId));
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
      for (const item of po.items) {
        await increaseStock(item.productId, item.quantityOrdered);
      }

      const updatedPOs = purchaseOrders.map(p =>
        p.id === poId ? { ...p, status: 'Received', updatedAt: new Date().toISOString() } : p
      );
      setPurchaseOrders(updatedPOs);
      
      const mockIndex = mockPurchaseOrders.findIndex(p => p.id === poId);
      if (mockIndex !== -1) {
        mockPurchaseOrders[mockIndex] = { ...mockPurchaseOrders[mockIndex], status: 'Received', updatedAt: new Date().toISOString()};
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
        <Link href="/purchasing/create" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New PO
          </Button>
        </Link>
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
                      <Badge className={`${purchaseOrderStatusColors[po.status] || 'bg-gray-200 text-gray-700'} px-2 py-1 text-xs font-medium rounded-full`}>
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
                          <DropdownMenuItem asChild>
                             <Link href={`/purchasing/${po.id}`}> {/* Updated Link */}
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/purchasing/${po.id}/edit`}> {/* Updated Link */}
                              <Edit className="mr-2 h-4 w-4" /> Edit PO
                            </Link>
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
