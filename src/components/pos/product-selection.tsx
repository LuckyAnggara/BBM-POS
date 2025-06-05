'use client';
import { useInventoryStore } from '@/store/inventory-store';
import { useCartStore } from '@/store/cart-store';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductSelection() {
  const { products, fetchProducts, isLoading } = useInventoryStore();
  const { addItem } = useCartStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) && product.quantity > 0
  );

  const ProductItemCard = ({ product }: { product: Product }) => (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-0">
        <div className="aspect-video w-full relative">
          <Image
            src={product.imageUrl || "https://placehold.co/300x200.png"}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="product item"
          />
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <h3 className="text-sm font-semibold truncate font-headline" title={product.name}>{product.name}</h3>
        <p className="text-xs text-muted-foreground">{product.category}</p>
        <p className="text-sm font-bold mt-1">${product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Button size="sm" className="w-full" onClick={() => addItem(product)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
  
  const ProductItemSkeleton = () => (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Skeleton className="aspect-video w-full" />
      </CardHeader>
      <CardContent className="p-3">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/2 mb-2" />
        <Skeleton className="h-5 w-1/4" />
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );


  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* TODO: Add category filters */}
      </div>
      <ScrollArea className="flex-1 p-4">
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <ProductItemSkeleton key={i} />)}
          </div>
        )}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No products match your search or all are out of stock.</p>
          </div>
        )}
        {!isLoading && filteredProducts.length > 0 && (
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductItemCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
