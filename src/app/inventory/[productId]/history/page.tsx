
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, History, Package, UserCircle, FileText } from 'lucide-react';
import type { StockMovement, Product as ProductType, StockMovementType } from '@/lib/types';
import { fetchStockMovementsByProductId } from '@/app/inventory/actions';
import { useInventoryStore } from '@/store/inventory-store';
import { Badge } from '@/components/ui/badge';

const movementTypeLabels: Record<StockMovementType, string> = {
  INITIAL_STOCK: 'Initial Stock',
  SALE: 'Sale',
  PURCHASE_RECEIPT: 'Purchase Receipt',
  RETURN_CUSTOMER: 'Customer Return',
  RETURN_SUPPLIER: 'Supplier Return',
  ADJUSTMENT_IN: 'Adjustment In',
  ADJUSTMENT_OUT: 'Adjustment Out',
  TRANSFER_IN: 'Transfer In',
  TRANSFER_OUT: 'Transfer Out',
};

const movementTypeColors: Record<StockMovementType, string> = {
  INITIAL_STOCK: 'bg-blue-100 text-blue-800 border-blue-300',
  SALE: 'bg-red-100 text-red-800 border-red-300',
  PURCHASE_RECEIPT: 'bg-green-100 text-green-800 border-green-300',
  RETURN_CUSTOMER: 'bg-teal-100 text-teal-800 border-teal-300',
  RETURN_SUPPLIER: 'bg-orange-100 text-orange-800 border-orange-300',
  ADJUSTMENT_IN: 'bg-lime-100 text-lime-800 border-lime-300',
  ADJUSTMENT_OUT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  TRANSFER_IN: 'bg-purple-100 text-purple-800 border-purple-300',
  TRANSFER_OUT: 'bg-pink-100 text-pink-800 border-pink-300',
};


export default function ProductStockHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [product, setProduct] = useState<ProductType | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { getProductById, fetchProducts, products: inventoryProducts } = useInventoryStore();

  useEffect(() => {
    async function loadData() {
      if (!productId) return;
      setIsLoading(true);
      try {
        if (inventoryProducts.length === 0) {
            await fetchProducts(); // Ensure products are loaded if not already
        }
        const fetchedProduct = getProductById(productId);
        setProduct(fetchedProduct);

        const fetchedMovements = await fetchStockMovementsByProductId(productId);
        setMovements(fetchedMovements);
        
      } catch (error) {
        toast.error('Failed to load stock history or product details.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [productId, fetchProducts, getProductById, inventoryProducts.length]); // Added inventoryProducts.length to re-fetch product if store updates

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-6 w-48" />
        </div>
        <Card>
            <CardHeader><Skeleton className="h-5 w-1/2" /></CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Product Not Found</h1>
            <p className="text-muted-foreground mb-4">The product for this stock history could not be found.</p>
            <Button onClick={() => router.push('/inventory')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
            </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-semibold">Stock Movement History</h1>
          <p className="text-muted-foreground">For Product: <Link href={`/inventory/${product.id}`} className="text-primary hover:underline font-medium">{product.name}</Link> (SKU: {product.sku})</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><History className="h-5 w-5 text-primary"/>Movements Log</CardTitle>
          <CardDescription>Detailed record of all stock changes for this product.</CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No stock movements recorded for this product yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Before</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  <TableHead>Reason / Reference</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((move) => (
                  <TableRow key={move.id}>
                    <TableCell className="text-xs">{format(parseISO(move.createdAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell>
                       <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 border ${movementTypeColors[move.type] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                      >
                        {movementTypeLabels[move.type] || move.type}
                       </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium text-xs ${move.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {move.quantityChange > 0 ? '+' : ''}{move.quantityChange}
                    </TableCell>
                    <TableCell className="text-right text-xs">{move.quantityBefore}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{move.quantityAfter}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={move.reason || move.referenceId || ''}>
                      {move.referenceId && (move.type === 'SALE' || move.type === 'PURCHASE_RECEIPT') ? (
                        <Link 
                            href={move.type === 'SALE' ? `/sales/history?search=${move.referenceId}` : `/purchasing/${move.referenceId}`} 
                            className="hover:underline text-primary"
                        >
                            {move.reason || move.referenceId}
                        </Link>
                      ) : (
                        move.reason || move.referenceId || 'N/A'
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                        {move.user ? (
                             <div className="flex items-center gap-1.5" title={move.user.name}>
                                <UserCircle className="h-3.5 w-3.5" />
                                <span className="truncate">{move.user.name.split(' ')[0]}</span>
                            </div>
                        ) : 'System'}
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
