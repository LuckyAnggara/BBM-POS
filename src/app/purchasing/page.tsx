
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Eye, Filter, Search, MoreHorizontal, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PurchaseOrder, PurchaseOrderItem } from '@/lib/types';
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
import { purchaseOrderStatusColors } from '@/lib/mock-data'; // Keep this for UI colors
import { fetchPurchaseOrders, deletePurchaseOrderById, updatePurchaseOrderStatus } from './actions';

export default function PurchasingPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { increaseStock, fetchProducts: fetchInventoryProducts } = useInventoryStore();

  const loadPOs = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchInventoryProducts(); // Ensure products are loaded for stock updates
      const fetchedPOs = await fetchPurchaseOrders();
      setPurchaseOrders(fetchedPOs);
    } catch (error) {
      toast.error("Failed to load purchase orders.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchInventoryProducts]);

  useEffect(() => {
    loadPOs();
  }, [loadPOs]);

  const filteredPurchaseOrders = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.status.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleDeletePO = (poId: string, poNumber: string) => {
     toast.warning(`Are you sure you want to delete PO "${poNumber}"?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deletePurchaseOrderById(poId);
            toast.success(`PO "${poNumber}" deleted.`);
            loadPOs(); // Refresh list
          } catch (error) {
            toast.error(`Failed to delete PO "${poNumber}".`);
          }
        },
      },
      cancel: { label: 'Cancel' }
    });
  }

  const handleReceivePO = async (po: PurchaseOrder) => {
    if (!po) {
      toast.error("Purchase Order not found.");
      return;
    }

    if (['Received', 'Cancelled', 'Closed'].includes(po.status)) {
      toast.info(`PO ${po.poNumber} is already ${po.status.toLowerCase()} and cannot be received again.`);
      return;
    }

    try {
      // Update PO status on server first
      await updatePurchaseOrderStatus(po.id, 'Received', po.items as PurchaseOrderItem[]);
      
      // Then update stock locally (client-side store)
      for (const item of po.items) {
        await increaseStock(item.productId, item.quantityOrdered);
      }
      
      toast.success(`Items for PO ${po.poNumber} received and stock updated.`);
      loadPOs(); // Refresh list
    } catch (error) {
      toast.error("Failed to update stock or PO status. Please check console for errors.");
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
                placeholder="Search by PO number, supplier, or status..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" disabled> {/* TODO: Implement filter */}
              <Filter className="mr-2 h-4 w-4" />
              Filter by Status
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
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">
                       <Link href={`/purchasing/${po.id}`} className="hover:underline">
                        {po.poNumber}
                       </Link>
                    </TableCell>
                    <TableCell>{po.supplierName}</TableCell>
                    <TableCell>{format(parseISO(po.orderDate), 'MMM dd, yyyy')}</TableCell>
                     <TableCell>
                        {po.expectedDeliveryDate ? format(parseISO(po.expectedDeliveryDate), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${purchaseOrderStatusColors[po.status] || 'bg-gray-200 text-gray-700'} px-2 py-1 text-xs font-medium rounded-full`}>
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                             <Link href={`/purchasing/${po.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/purchasing/${po.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" /> Edit PO
                            </Link>
                          </DropdownMenuItem>
                           <DropdownMenuItem
                            onClick={() => handleReceivePO(po)}
                            disabled={['Received', 'Cancelled', 'Closed'].includes(po.status)}
                          >
                            <PackageCheck className="mr-2 h-4 w-4" /> Mark as Received
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeletePO(po.id, po.poNumber)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
