
'use client';
import { useInventoryStore } from '@/store/inventory-store';
import { useCartStore } from '@/store/cart-store';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card'; // Removed CardHeader, CardDescription, CardTitle
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, ScanBarcode, ChevronDown, Filter } from 'lucide-react'; // Added ScanBarcode, ChevronDown
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"


const categories = ["All Product", "Men", "Women", "Unisex", "Kids", "Accessories"];
const sizes = ["XS", "S", "M", "L", "XL"];
const colors = ["#3b82f6", "#6b7280", "#10b981", "#ef4444"]; // Example colors: blue, gray, green, red


export function ProductSelection() {
  const { products, fetchProducts, isLoading } = useInventoryStore();
  const { addItem } = useCartStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState("All Product");

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    product.quantity > 0 &&
    (activeCategory === "All Product" || product.category.toLowerCase() === activeCategory.toLowerCase())
  );

  const ProductItemCard = ({ product }: { product: Product }) => (
    <Card className="overflow-hidden transition-all hover:shadow-md flex flex-col">
      <div className="aspect-[4/3] w-full relative"> {/* Adjusted aspect ratio for image */}
        <Image
          src={product.imageUrl || "https://placehold.co/300x200.png"}
          alt={product.name}
          layout="fill"
          objectFit="cover"
          data-ai-hint="product clothing"
        />
      </div>
      <CardContent className="p-3 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold truncate font-headline" title={product.name}>{product.name}</h3>
          <p className="text-xs text-muted-foreground mb-2">{product.category || "General"}</p>
          
          {/* Size Selection - Visual Placeholder */}
          <div className="mb-2">
            <p className="text-xs text-muted-foreground mb-1">Size</p>
            <ToggleGroup type="single" defaultValue="M" size="sm" className="flex flex-wrap gap-1">
              {sizes.map(size => (
                <ToggleGroupItem key={size} value={size} aria-label={size} className="h-7 px-2 text-xs border">
                  {size}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Color Selection - Visual Placeholder */}
          <div className="mb-2">
            <p className="text-xs text-muted-foreground mb-1">Colors</p>
            <div className="flex space-x-1">
              {colors.map((color, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-full border-2 border-white focus:ring-2 focus:ring-offset-0 focus:ring-black data-[state=active]:border-primary"
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${idx + 1}`}
                  // onClick={() => console.log("Color selected:", color)} // Placeholder action
                >
                   <span className="sr-only">Select color {color}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
            <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
            <Button size="sm" onClick={() => addItem(product)} className="whitespace-nowrap">
                <PlusCircle className="mr-1.5 h-4 w-4" /> Add to cart
            </Button>
        </div>

      </CardContent>
    </Card>
  );
  
  const ProductItemSkeleton = () => (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-3">
        <Skeleton className="h-5 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/2 mb-3" />
        <Skeleton className="h-4 w-1/4 mb-1" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-1/4 mb-1" />
        <Skeleton className="h-6 w-full mb-3" />
        <div className="flex items-center justify-between mt-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-9 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );


  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-headline">List Product</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled> {/* Placeholder */}
              <ScanBarcode className="mr-2 h-4 w-4" /> Scan Barcode
            </Button>
            <Button variant="outline" size="sm" disabled className="min-w-[100px]"> {/* Placeholder */}
              Newest <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full rounded-md bg-background pl-8 pr-2 h-10" // Adjusted padding and height
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
         <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2">
          {categories.map(category => (
            <Button 
              key={category} 
              variant={activeCategory === category ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1 p-4 bg-muted/20"> {/* Added background for contrast */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4"> {/* Adjusted grid for potentially larger cards */}
            {[...Array(6)].map((_, i) => <ProductItemSkeleton key={i} />)}
          </div>
        )}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No products match your search or filters.</p>
          </div>
        )}
        {!isLoading && filteredProducts.length > 0 && (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4"> {/* Adjusted grid */}
            {filteredProducts.map(product => (
              <ProductItemCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
