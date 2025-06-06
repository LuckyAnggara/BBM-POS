
'use client';
import { useInventoryStore } from '@/store/inventory-store';
import { useCartStore } from '@/store/cart-store';
import type { Product, Category } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, ListTree, LayoutGrid, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { fetchAllCategoriesAction } from '@/app/inventory/actions';

const CARD_ITEMS_PER_PAGE = 12; // Increased for smaller cards
const TABLE_ITEMS_PER_PAGE = 10;

const ProductItemCard = ({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product) => void }) => (
  <Card className="overflow-hidden transition-all hover:shadow-md flex flex-col">
    <div className="aspect-[4/3] w-full relative">
      <Image
        src={product.imageUrl || "https://placehold.co/300x200.png"}
        alt={product.name}
        layout="fill"
        objectFit="cover"
        data-ai-hint="product clothing"
      />
    </div>
    <CardContent className="p-2.5 flex-grow flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-semibold leading-tight truncate font-headline" title={product.name}>{product.name}</h3>
        <p className="text-xs text-muted-foreground mb-1.5">{product.category?.name || "Uncategorized"}</p>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-sm font-bold">${product.price.toFixed(2)}</p>
        <Button size="sm" onClick={() => onAddToCart(product)} className="whitespace-nowrap h-8 px-2.5 text-xs">
          <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </div>
    </CardContent>
  </Card>
);

const ProductItemSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="aspect-[4/3] w-full" />
    <CardContent className="p-2.5">
      <Skeleton className="h-4 w-3/4 mb-1" />
      <Skeleton className="h-3 w-1/2 mb-2" />
      <div className="flex items-center justify-between mt-1.5">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-16" />
      </div>
    </CardContent>
  </Card>
);

export function ProductSelection() {
  const { products, fetchProducts, isLoading: isLoadingProducts } = useInventoryStore();
  const { addItem } = useCartStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState("All Product");
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true);
      try {
        const fetchedCategories = await fetchAllCategoriesAction();
        setAllCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to load categories:", error);
        toast.error("Could not load categories for filtering.");
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem(product);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = activeCategory === "All Product" || product.category?.name?.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory && product.quantity > 0;
    });
  }, [products, searchTerm, activeCategory]);

  const itemsPerPage = viewMode === 'card' ? CARD_ITEMS_PER_PAGE : TABLE_ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleCategoryChange = (categoryName: string) => {
    setActiveCategory(categoryName);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const isLoading = isLoadingProducts || isLoadingCategories;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold font-headline">Product List</h2>
          <div className="flex items-center gap-1.5">
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setViewMode('card')}
              aria-label="Card view"
              className="h-8 w-8"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className="h-8 w-8"
            >
              <ListTree className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-grow w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full rounded-md bg-background pl-8 pr-2 h-9 text-xs"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto h-9 min-w-[160px] justify-between text-xs px-3" disabled={isLoadingCategories}>
                <span className="truncate">{activeCategory === "All Product" ? "Filter by Category" : activeCategory}</span>
                <Filter className="ml-1.5 h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
              <DropdownMenuLabel className="text-xs">Select Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={activeCategory} onValueChange={handleCategoryChange}>
                <DropdownMenuRadioItem value="All Product" className="text-xs">All Product</DropdownMenuRadioItem>
                {allCategories.map(cat => (
                  <DropdownMenuRadioItem key={cat.id} value={cat.name} className="text-xs">
                    {cat.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {activeCategory !== "All Product" && (
          <div className="pt-0.5">
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {activeCategory}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 text-muted-foreground hover:bg-transparent hover:text-foreground"
                onClick={() => handleCategoryChange("All Product")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-3 bg-muted/20">
        {isLoading && (
          viewMode === 'card' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3"> {/* Adjusted grid for more items */}
              {[...Array(CARD_ITEMS_PER_PAGE)].map((_, i) => <ProductItemSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-1.5">
              {[...Array(TABLE_ITEMS_PER_PAGE)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          )
        )}
        {!isLoading && currentItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No products match your search or filters.</p>
          </div>
        )}
        {!isLoading && currentItems.length > 0 && (
          viewMode === 'card' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3"> {/* Adjusted grid for more items */}
              {currentItems.map(product => (
                <ProductItemCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[48px] px-2 py-1.5 text-xs">Img</TableHead>
                    <TableHead className="px-2 py-1.5 text-xs">Name</TableHead>
                    <TableHead className="px-2 py-1.5 text-xs">Category</TableHead>
                    <TableHead className="text-right px-2 py-1.5 text-xs">Price</TableHead>
                    <TableHead className="text-right px-2 py-1.5 text-xs">Stock</TableHead>
                    <TableHead className="text-center w-[100px] px-2 py-1.5 text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map(product => (
                    <TableRow key={product.id}>
                      <TableCell className="px-2 py-1.5">
                        <Image
                          src={product.imageUrl || "https://placehold.co/32x32.png"}
                          alt={product.name}
                          width={32}
                          height={32}
                          className="rounded-sm object-cover"
                          data-ai-hint="product thumbnail"
                        />
                      </TableCell>
                      <TableCell className="font-medium truncate px-2 py-1.5 text-xs" title={product.name}>{product.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground px-2 py-1.5">{product.category?.name || 'Uncategorized'}</TableCell>
                      <TableCell className="text-right px-2 py-1.5 text-xs">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right px-2 py-1.5">
                        <Badge variant={product.quantity < (product.lowStockThreshold || 10) ? "destructive" : "secondary"} className="text-xs px-1.5 py-0.5">
                          {product.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center px-2 py-1.5">
                        <Button size="sm" onClick={() => handleAddToCart(product)} className="h-7 text-xs px-2 py-1">
                          <PlusCircle className="mr-1 h-3 w-3" /> Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )
        )}
      </ScrollArea>

      {!isLoading && totalPages > 1 && (
        <div className="p-3 border-t flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 text-xs px-2.5"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 text-xs px-2.5"
          >
            Next
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
