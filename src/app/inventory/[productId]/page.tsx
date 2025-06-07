
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInventoryStore } from '@/store/inventory-store';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Tag, DollarSign, Package, Layers, Info, AlertTriangle, Archive, ArchiveRestore, History, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner'; // For toast notifications
import { usePageTitle } from '@/components/layout/page-title-context';

export default function ProductDetailPage() {
  usePageTitle('Product Details');
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const { products, fetchProducts, isLoading, getProductById, deleteProduct, updateProduct } = useInventoryStore();
  const [product, setProduct] = useState<Product | null | undefined>(undefined); // undefined for initial loading state
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    if (products.length === 0 && !isLoading) {
      fetchProducts();
    }
  }, [products.length, isLoading, fetchProducts]);

  useEffect(() => {
    if (productId && products.length > 0) {
      const foundProduct = getProductById(productId);
      setProduct(foundProduct);
    } else if (productId && !isLoading && products.length === 0) {
      // This case handles if products weren't fetched yet or fetch failed
      // And we directly navigated to this page.
      // getProductById might return undefined, so we rely on fetchProducts to fill the store
      // and then this effect will re-run.
      // If fetchProducts already ran and failed, product will remain undefined
      // or could be set to null if fetchProducts updates store on failure.
       const foundProduct = getProductById(productId);
       setProduct(foundProduct); // This might set to undefined if not found after initial fetch
    }
  }, [productId, products, getProductById, isLoading]);
  
  const handleDelete = () => {
    if (!product) return;
    toast.warning(`Are you sure you want to permanently delete "${product.name}"?`, {
      description: 'This action cannot be undone and will remove the product from inventory.',
      action: {
        label: 'Delete Permanently',
        onClick: async () => {
          await deleteProduct(product.id);
          router.push('/inventory'); // Navigate back to inventory list after deletion
        }
      },
      cancel: {
        label: 'Cancel',
      }
    });
  };

  const toggleArchiveProduct = async () => {
    if (!product) return;
    setIsArchiving(true);
    const isCurrentlyArchived = product.tags?.includes('archived');
    const newTags = isCurrentlyArchived
      ? product.tags?.filter(t => t !== 'archived')
      : [...(product.tags || []), 'archived'];

    try {
      const updatedProd = await updateProduct(product.id, { tags: newTags });
      if (updatedProd) {
        setProduct(updatedProd); // Update local state with the response
        toast.success(`Product "${product.name}" ${isCurrentlyArchived ? 'unarchived' : 'archived'}.`);
      } else {
        toast.error("Failed to update product archive status.");
      }
    } catch (error) {
      toast.error("An error occurred while updating the product.");
      console.error("Archive toggle error:", error);
    } finally {
      setIsArchiving(false);
    }
  };

  const isArchived = product?.tags?.includes('archived');

  if (isLoading && product === undefined) { // Show skeleton only on initial load phase
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"> <Skeleton className="h-10 w-24" /> <div className="flex gap-2"> <Skeleton className="h-10 w-20" /> <Skeleton className="h-10 w-20" /> </div> </div>
        <Card> <CardHeader> <Skeleton className="h-8 w-3/4 mb-2" /> <Skeleton className="h-4 w-1/2" /> </CardHeader> <CardContent className="grid md:grid-cols-3 gap-6"> <div> <Skeleton className="aspect-square w-full rounded-lg" /> </div> <div className="md:col-span-2 space-y-4"> <Skeleton className="h-6 w-1/3" /> <Skeleton className="h-5 w-1/4" /> <Skeleton className="h-5 w-1/2" /> <Skeleton className="h-16 w-full" /> <Skeleton className="h-5 w-1/3" /> </div> </CardContent> </Card>
      </div>
    );
  }

  if (!product) { // product is null or undefined after loading attempt
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-4"> The product you are looking for (ID: {productId}) does not exist or could not be loaded. </p>
        <Button onClick={() => router.push('/inventory')}> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}> <ArrowLeft className="h-4 w-4" /> </Button>
          {/* Main title and description elements removed */}
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {product.name}
              {isArchived && <Badge variant="outline" className="text-sm border-orange-500 text-orange-600 bg-orange-500/10">Archived</Badge>}
            </h2>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
           <Button variant="outline" onClick={toggleArchiveProduct} disabled={isArchiving}>
            {isArchiving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (isArchived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />)}
            {isArchiving ? (isArchived ? 'Unarchiving...' : 'Archiving...') : (isArchived ? 'Unarchive Product' : 'Archive Product')}
          </Button>
          <Link href={`/inventory/${product.id}/edit`} passHref> <Button variant="outline"> <Edit className="mr-2 h-4 w-4" /> Edit </Button> </Link>
          <Button variant="destructive" onClick={handleDelete}> <Trash2 className="mr-2 h-4 w-4" /> Delete </Button>
          <Link href={`/inventory/${product.id}/history`} passHref>
            <Button variant="outline"> <History className="mr-2 h-4 w-4" /> Stock History </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0 md:p-6 grid md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1 p-6 md:p-0">
            <div className="aspect-[4/3] relative rounded-lg overflow-hidden border bg-muted/30">
              <Image
                src={product.imageUrl || "https://placehold.co/600x400.png"}
                alt={product.name}
                layout="fill"
                objectFit="contain" // Changed to contain to see full image, or cover if preferred
                className="hover:scale-105 transition-transform duration-300"
                data-ai-hint="product main"
              />
            </div>
          </div>
          <div className="md:col-span-2 p-6 pt-0 md:p-0 space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold font-headline">{product.name}</h2>
              <p className="text-sm text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
            </div>
            
            <Separator/>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-2"> <DollarSign className="h-4 w-4 text-primary"/> <div> <p className="text-muted-foreground">Selling Price</p> <p className="font-semibold">${product.price.toFixed(2)}</p> </div> </div>
              <div className="flex items-center gap-2"> <DollarSign className="h-4 w-4 text-muted-foreground"/> <div> <p className="text-muted-foreground">Cost Price</p> <p className="font-semibold">${(product.costPrice || 0).toFixed(2)}</p> </div> </div>
              <div className="flex items-center gap-2"> <Package className="h-4 w-4 text-primary"/> <div> <p className="text-muted-foreground">Current Stock</p> <p className="font-semibold">{product.quantity} units</p> </div> </div>
              <div className="flex items-center gap-2"> <Layers className="h-4 w-4 text-primary"/> <div> <p className="text-muted-foreground">Low Stock At</p> <p className="font-semibold">{product.lowStockThreshold || 10} units</p> </div> </div>
            </div>
             {product.supplier && (
                <div className="flex items-center gap-2 text-sm"> <UserCircle className="h-4 w-4 text-muted-foreground"/> <div> <p className="text-muted-foreground">Supplier</p> <p className="font-semibold">{product.supplier}</p> </div> </div>
            )}
            
            {product.description && (
              <div>
                <h3 className="font-semibold mb-1 flex items-center gap-2"><Info className="h-4 w-4 text-primary"/>Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-1 flex items-center gap-2"><Tag className="h-4 w-4 text-primary"/>Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                </div>
              </div>
            )}
          </CardContent>
        </CardFooter>
         <CardFooter className="border-t p-4 text-xs text-muted-foreground">
            <div className="grid grid-cols-2 gap-4 w-full">
                <span>Last Updated: {new Date(product.updatedAt).toLocaleDateString()}</span>
                <span>Created: {new Date(product.createdAt).toLocaleDateString()}</span>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
