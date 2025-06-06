
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInventoryStore } from '@/store/inventory-store';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Package, DollarSign, BarChart3, Tag, Info, CalendarDays, Truck, AlertTriangle, ListTree, PackageX, PackageCheck, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const { products, fetchProducts, getProductById, updateProduct } = useInventoryStore();
  const [product, setProduct] = useState<Product | null | undefined>(undefined); // undefined for loading, null for not found
  const [isUpdatingArchiveStatus, setIsUpdatingArchiveStatus] = useState(false);

  const loadProductData = useCallback(async () => {
    if (products.length === 0) {
      // Ensure products are fetched if not already in store
      // This also helps if navigating directly to this page
      await fetchProducts();
    }
    // After fetchProducts completes (or if products were already there), try to get the specific product
    // Need to get the fresh state of products after fetchProducts
    const currentProducts = useInventoryStore.getState().products;
    const foundProduct = currentProducts.find(p => p.id === productId);
    setProduct(foundProduct);
  }, [productId, products.length, fetchProducts]);


  useEffect(() => {
    loadProductData();
  }, [loadProductData]); // productId and fetchProducts are stable, products.length changes will trigger

  useEffect(() => {
    // This effect updates the local product state if the product in the store changes
    // (e.g., after an update like archiving)
    if (productId && products.length > 0) {
      const foundProduct = getProductById(productId);
      setProduct(foundProduct);
    }
  }, [productId, products, getProductById]);


  const handleToggleArchiveStatus = async () => {
    if (!product) return;
    setIsUpdatingArchiveStatus(true);
    try {
      const isCurrentlyArchived = product.tags?.includes('archived');
      const newTags = isCurrentlyArchived
        ? product.tags?.filter(t => t !== 'archived')
        : [...(product.tags || []), 'archived'];
      
      await updateProduct(product.id, { tags: newTags });
      toast.success(`Product "${product.name}" has been ${isCurrentlyArchived ? 'unarchived' : 'archived'}.`);
    } catch (error) {
      toast.error("Failed to update product archive status.");
      console.error(error);
    } finally {
      setIsUpdatingArchiveStatus(false);
    }
  };


  if (product === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-8 w-64 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-40 w-full rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-end">
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The product with ID "{productId}" could not be found.
        </p>
        <Button onClick={() => router.push('/inventory')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
        </Button>
      </div>
    );
  }

  const isArchived = product.tags?.includes('archived');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/inventory')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Inventory</span>
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-semibold">{product.name}</h1>
            <p className="text-muted-foreground">Details for SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleToggleArchiveStatus} variant="outline" disabled={isUpdatingArchiveStatus}>
            {isUpdatingArchiveStatus ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isArchived ? (
              <PackageCheck className="mr-2 h-4 w-4" />
            ) : (
              <PackageX className="mr-2 h-4 w-4" />
            )}
            {isUpdatingArchiveStatus ? (isArchived ? 'Unarchiving...' : 'Archiving...') : (isArchived ? 'Unarchive Product' : 'Archive Product')}
          </Button>
          <Link href={`/inventory/${product.id}/edit`} passHref>
            <Button>
              <Edit className="mr-2 h-4 w-4" /> Edit Product
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[1fr_2fr]">
          <div className="p-6 bg-muted/30 flex items-center justify-center">
            <Image
              src={product.imageUrl || 'https://placehold.co/400x300.png'}
              alt={product.name}
              width={400}
              height={300}
              className="rounded-lg object-cover shadow-md aspect-[4/3]"
              data-ai-hint="product main image"
            />
          </div>
          <div className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl font-semibold">{product.name}</CardTitle>
                    <CardDescription>
                        <Badge variant="outline" className="mr-2 flex items-center gap-1 text-xs">
                            <ListTree className="h-3 w-3" />
                            {product.category?.name || 'Uncategorized'}
                        </Badge>
                        SKU: {product.sku}
                    </CardDescription>
                </div>
                 {isArchived && (
                    <Badge variant='outline' className='border-orange-500 text-orange-600 bg-orange-500/10 text-sm'>
                        <PackageX className="mr-2 h-4 w-4" /> Archived
                    </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow">
              {product.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><Info className="h-4 w-4 mr-2"/>Description</h3>
                  <p className="text-sm">{product.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><DollarSign className="h-4 w-4 mr-2"/>Pricing</h3>
                  <p className="text-sm">Selling Price: <span className="font-semibold">${product.price.toFixed(2)}</span></p>
                  {product.costPrice !== undefined && product.costPrice !== null && <p className="text-sm">Cost Price: <span className="font-semibold">${product.costPrice.toFixed(2)}</span></p>}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><Package className="h-4 w-4 mr-2"/>Stock</h3>
                  <div className="text-sm">Quantity: <Badge variant={product.quantity < (product.lowStockThreshold || 10) ? "destructive" : "default"}>{product.quantity}</Badge></div>
                  {product.lowStockThreshold !== undefined && product.lowStockThreshold !== null && <p className="text-sm">Low Stock Threshold: {product.lowStockThreshold}</p>}
                </div>
                {product.supplier && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><Truck className="h-4 w-4 mr-2"/>Supplier</h3>
                    <p className="text-sm">{product.supplier}</p>
                  </div>
                )}
                {product.tags && product.tags.filter(tag => tag !== 'archived').length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><Tag className="h-4 w-4 mr-2"/>Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {product.tags.filter(tag => tag !== 'archived').map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><CalendarDays className="h-4 w-4 mr-2"/>Dates</h3>
                  <p className="text-sm">Created: {format(new Date(product.createdAt), "MMM dd, yyyy - p")}</p>
                  <p className="text-sm">Last Updated: {format(new Date(product.updatedAt), "MMM dd, yyyy - p")}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6 bg-muted/20 flex justify-end">
                 <Link href={`/inventory/${product.id}/edit`} passHref>
                    <Button>
                        <Edit className="mr-2 h-4 w-4" /> Edit Product
                    </Button>
                </Link>
            </CardFooter>
          </div>
        </div>
      </Card>
    </div>
  );
}
