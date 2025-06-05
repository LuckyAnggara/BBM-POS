
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInventoryStore } from '@/store/inventory-store';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Package, DollarSign, BarChart3, Tag, Info, CalendarDays, Truck, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const { products, fetchProducts, getProductById } = useInventoryStore();
  const [product, setProduct] = useState<Product | null | undefined>(undefined); // undefined for loading, null for not found

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  useEffect(() => {
    if (productId && products.length > 0) {
      const foundProduct = getProductById(productId);
      setProduct(foundProduct);
    }
  }, [productId, products, getProductById]);

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
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
        <Link href={`/inventory/${product.id}/edit`} passHref>
          <Button>
            <Edit className="mr-2 h-4 w-4" /> Edit Product
          </Button>
        </Link>
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
              <CardTitle className="text-2xl font-semibold">{product.name}</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mr-2">{product.category}</Badge>
                SKU: {product.sku}
              </CardDescription>
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
                  {product.costPrice !== undefined && <p className="text-sm">Cost Price: <span className="font-semibold">${product.costPrice.toFixed(2)}</span></p>}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><Package className="h-4 w-4 mr-2"/>Stock</h3>
                  <p className="text-sm">Quantity: <Badge variant={product.quantity < (product.lowStockThreshold || 10) ? "destructive" : "default"}>{product.quantity}</Badge></p>
                  {product.lowStockThreshold !== undefined && <p className="text-sm">Low Stock Threshold: {product.lowStockThreshold}</p>}
                </div>
                {product.supplier && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><Truck className="h-4 w-4 mr-2"/>Supplier</h3>
                    <p className="text-sm">{product.supplier}</p>
                  </div>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center"><Tag className="h-4 w-4 mr-2"/>Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {product.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
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
