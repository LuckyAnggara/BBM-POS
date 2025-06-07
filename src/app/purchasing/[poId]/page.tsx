
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { PurchaseOrder as AppPurchaseOrder, Product } from '@/lib/types';
// Removed mockPurchaseOrders import, purchaseOrderStatusColors is still used from mock-data
import { purchaseOrderStatusColors } from '@/lib/mock-data'; 
import { useInventoryStore } from '@/store/inventory-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, CalendarDays, User, AlertTriangle, Loader2, Info, Truck } from 'lucide-react'; // Removed Hash, ShoppingBag, MessageSquare, Percent as they might not be directly used or replaced.
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchPurchaseOrderById } from '../actions'; // Import server action
import { usePageTitle } from '@/components/layout/page-title-context';
import { toast } from 'sonner';


export default function PurchaseOrderDetailPage() {
  usePageTitle('Purchase Order Details');
  const router = useRouter();
  const params = useParams();
  const poId = params.poId as string;

  const [purchaseOrder, setPurchaseOrder] = useState<AppPurchaseOrder | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  // Removed inventoryProducts and fetchInventory from here, product details should come with PO

  const loadPO = useCallback(async () => {
    if (!poId) {
      setIsLoading(false);
      setPurchaseOrder(null);
      return;
    }
    setIsLoading(true);
    try {
      const poData = await fetchPurchaseOrderById(poId);
      setPurchaseOrder(poData);
    } catch (error) {
      console.error("Failed to load PO details:", error);
      toast.error("Failed to load PO details.");
      setPurchaseOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    loadPO();
  }, [loadPO]);


  if (isLoading) { // Simplified loading state
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4"> <Skeleton className="h-10 w-10 rounded-md" /> <div> <Skeleton className="h-8 w-64 mb-1" /> <Skeleton className="h-4 w-48" /> </div> </div>
        <Card> <CardHeader> <Skeleton className="h-6 w-1/2" /> <Skeleton className="h-4 w-3/4 mt-1" /> </CardHeader> <CardContent className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)} </div> <Skeleton className="h-40 w-full rounded-md" /> </CardContent> <CardFooter className="border-t pt-4 flex justify-end"> <Skeleton className="h-10 w-24" /> </CardFooter> </Card>
      </div>
    );
  }

  if (!purchaseOrder) { // purchaseOrder is null after loading attempt
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Purchase Order Not Found</h1>
        <p className="text-muted-foreground mb-4"> The Purchase Order with ID "{poId}" could not be found. </p>
        <Button onClick={() => router.push('/purchasing')}> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Purchase Orders </Button>
      </div>
    );
  }
  
  const subtotal = purchaseOrder.items.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/purchasing')}> <ArrowLeft className="h-4 w-4" /> <span className="sr-only">Back to Purchase Orders</span> </Button>
          {/* Title and description elements removed */}
          <div>
             <h2 className="text-xl font-semibold">PO: {purchaseOrder.poNumber}</h2>
             <p className="text-sm text-muted-foreground">Details for Purchase Order</p>
          </div>
        </div>
        <Link href={`/purchasing/${purchaseOrder.id}/edit`} passHref> <Button> <Edit className="mr-2 h-4 w-4" /> Edit PO </Button> </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div> <CardTitle className="text-2xl">Supplier: {purchaseOrder.supplierName}</CardTitle> <CardDescription>PO Number: {purchaseOrder.poNumber}</CardDescription> </div>
            <Badge className={`${purchaseOrderStatusColors[purchaseOrder.status] || 'bg-gray-200 text-gray-700'} px-3 py-1.5 text-sm font-medium`}> {purchaseOrder.status} </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center gap-2"> <CalendarDays className="h-5 w-5 text-muted-foreground" /> <div> <p className="text-muted-foreground">Order Date</p> <p className="font-medium">{format(parseISO(purchaseOrder.orderDate), 'PPP')}</p> </div> </div>
            {purchaseOrder.expectedDeliveryDate && ( <div className="flex items-center gap-2"> <CalendarDays className="h-5 w-5 text-muted-foreground" /> <div> <p className="text-muted-foreground">Expected Delivery</p> <p className="font-medium">{format(parseISO(purchaseOrder.expectedDeliveryDate), 'PPP')}</p> </div> </div> )}
            {purchaseOrder.createdBy && (
                <div className="flex items-center gap-2"> <User className="h-5 w-5 text-muted-foreground" /> <div> <p className="text-muted-foreground">Created By</p> <p className="font-medium">{purchaseOrder.createdBy.name}</p> </div> </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 font-headline">Items Ordered</h3>
            <Table>
              <TableHeader> <TableRow> <TableHead>Product Name</TableHead> <TableHead>SKU</TableHead> <TableHead className="text-right">Qty Ordered</TableHead> <TableHead className="text-right">Unit Cost</TableHead> <TableHead className="text-right">Total Cost</TableHead> </TableRow> </TableHeader>
              <TableBody>
                {purchaseOrder.items.map((item) => (
                  <TableRow key={item.id || item.productId}> {/* Use item.id if available from DB, else productId */}
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.product?.sku || 'N/A'}</TableCell> {/* SKU from included product */}
                    <TableCell className="text-right">{item.quantityOrdered}</TableCell>
                    <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${item.totalCost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {purchaseOrder.notes && ( <div> <h3 className="text-lg font-semibold mb-1 font-headline flex items-center gap-2"><Info className="h-4 w-4"/>Notes</h3> <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{purchaseOrder.notes}</p> </div> )}

        </CardContent>
        <CardFooter className="border-t bg-muted/30 p-6 flex flex-col items-end gap-1">
            <div className="text-right w-full"> <p className="text-sm text-muted-foreground">Items Subtotal</p> <p className="text-lg font-semibold">${subtotal.toFixed(2)}</p> </div>
            { (purchaseOrder.discountAmount ?? 0) > 0 && <div className="text-right w-full"> <p className="text-sm text-muted-foreground">Discount</p> <p className="text-lg font-semibold text-green-600">-${(purchaseOrder.discountAmount || 0).toFixed(2)}</p> </div> }
            <div className="text-right w-full"> <p className="text-sm text-muted-foreground">Shipping Cost</p> <p className="text-lg font-semibold">${(purchaseOrder.shippingCost || 0).toFixed(2)}</p> </div>
            <div className="text-right w-full"> <p className="text-sm text-muted-foreground">Taxes</p> <p className="text-lg font-semibold">${(purchaseOrder.taxes || 0).toFixed(2)}</p> </div>
            <div className="border-t w-full my-2 border-border"></div>
            <div className="text-right w-full mt-1"> <p className="text-sm text-muted-foreground">Grand Total</p> <p className="text-2xl font-bold font-headline">${purchaseOrder.totalAmount.toFixed(2)}</p> </div>
        </CardFooter>
      </Card>
    </div>
  );
}
