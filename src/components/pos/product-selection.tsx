
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

const CARD_ITEMS_PER_PAGE = 9;
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
    <CardContent className="p-3 flex-grow flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold truncate font-headline" title={product.name}>{product.name}</h3>
        <p className="text-xs text-muted-foreground mb-2">{product.category?.name || "Uncategorized"}</p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
        <Button size="sm" onClick={() => onAddToCart(product)} className="whitespace-nowrap">
          <PlusCircle className="mr-1.5 h-4 w-4" /> Add
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
      <div className="flex items-center justify-between mt-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-9 w-20" />
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
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold font-headline">Product List</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setViewMode('card')}
              aria-label="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              <ListTree className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-grow w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products by name or SKU..."
              className="w-full rounded-md bg-background pl-8 pr-2 h-10"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto h-10 min-w-[180px] justify-between" disabled={isLoadingCategories}>
                <span className="truncate">{activeCategory === "All Product" ? "Filter by Category" : activeCategory}</span>
                <Filter className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
              <DropdownMenuLabel>Select Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={activeCategory} onValueChange={handleCategoryChange}>
                <DropdownMenuRadioItem value="All Product">All Product</DropdownMenuRadioItem>
                {allCategories.map(cat => (
                  <DropdownMenuRadioItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {activeCategory !== "All Product" && (
          <div className="pt-1">
            <Badge variant="secondary" className="text-sm">
              {activeCategory}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1 text-muted-foreground hover:bg-transparent hover:text-foreground"
                onClick={() => handleCategoryChange("All Product")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </Badge>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4 bg-muted/20">
        {isLoading && (
          viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(CARD_ITEMS_PER_PAGE)].map((_, i) => <ProductItemSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-2">
              {[...Array(TABLE_ITEMS_PER_PAGE)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          )
        )}
        {!isLoading && currentItems.length === 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No products match your search or filters.</p>
          </div>
        )}
        {!isLoading && currentItems.length > 0 && (
          viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {currentItems.map(product => (
                <ProductItemCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center w-[120px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image
                          src={product.imageUrl || "https://placehold.co/40x40.png"}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-sm object-cover"
                          data-ai-hint="product thumbnail"
                        />
                      </TableCell>
                      <TableCell className="font-medium truncate" title={product.name}>{product.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{product.category?.name || 'Uncategorized'}</TableCell>
                      <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={product.quantity < (product.lowStockThreshold || 10) ? "destructive" : "secondary"}>
                          {product.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button size="sm" onClick={() => handleAddToCart(product)} className="h-8 text-xs">
                          <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add
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
        <div className="p-4 border-t flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
