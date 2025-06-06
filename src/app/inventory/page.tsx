
'use client';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Filter, MoreHorizontal, Eye, Package, History, PackagePlus } from "lucide-react";
import Image from 'next/image';
import { useInventoryStore } from '@/store/inventory-store';
import type { Product, Category } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchAllCategoriesAction } from '@/app/inventory/actions'; // For category filter

export default function InventoryPage() {
  const { products, fetchProducts, isLoading, deleteProduct, updateProduct } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

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
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);
  
  useEffect(() => {
    const categoryQuery = searchParams.get('category');
    if (categoryQuery) {
      setActiveCategory(categoryQuery);
    } else {
      setActiveCategory(null);
    }
  }, [searchParams]);

  const handleCategoryFilter = (categoryName: string | null) => {
    setActiveCategory(categoryName);
    const params = new URLSearchParams(searchParams.toString());
    if (categoryName) {
      params.set('category', categoryName);
    } else {
      params.delete('category');
    }
    router.push(`/inventory?${params.toString()}`);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !activeCategory || product.category?.name === activeCategory;
    const isNotArchived = !product.tags?.includes('archived'); // Exclude archived products from default view
    return matchesSearch && matchesCategory && isNotArchived;
  });

  const handleDelete = (productId: string, productName: string) => {
    toast.warning(`Are you sure you want to PERMANENTLY delete "${productName}"?`, {
      description: 'This action cannot be undone and will remove the product from inventory and all associated stock movements.',
      action: {
        label: 'Delete Permanently',
        onClick: () => deleteProduct(productId),
      },
      cancel: { label: 'Cancel' },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-semibold flex items-center gap-2"><Package className="h-8 w-8 text-primary"/>Inventory Overview</h1>
          <p className="text-muted-foreground">Manage all your products, stock levels, and details.</p>
        </div>
        <Link href="/inventory/add" passHref>
            <Button>
            <PackagePlus className="mr-2 h-4 w-4" /> Add New Product
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
                placeholder="Search products by name, SKU, supplier..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isLoadingCategories}>
                    <Filter className="mr-2 h-4 w-4" />
                    {activeCategory || "All Categories"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={!activeCategory}
                    onCheckedChange={() => handleCategoryFilter(null)}
                  >
                    All Categories
                  </DropdownMenuCheckboxItem>
                  {allCategories.map(cat => (
                    <DropdownMenuCheckboxItem
                      key={cat.id}
                      checked={activeCategory === cat.name}
                      onCheckedChange={() => handleCategoryFilter(cat.name)}
                    >
                      {cat.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[60px]">Img</TableHead>
                    <TableHead>Name / SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px] mb-1" /><Skeleton className="h-3 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[30px] ml-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-8 w-[30px] mx-auto" /></TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No products found in inventory.</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search/filters or add a new product.</p>
            </div>
            ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[60px]">Img</TableHead>
                    <TableHead>Name / SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                    <TableCell>
                        <Link href={`/inventory/${product.id}`}>
                            <Image
                            src={product.imageUrl || "https://placehold.co/40x40.png"}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover hover:opacity-80 transition-opacity"
                            data-ai-hint="product inventory"
                            />
                        </Link>
                    </TableCell>
                    <TableCell>
                        <Link href={`/inventory/${product.id}`} className="font-medium hover:underline">{product.name}</Link>
                        <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                    </TableCell>
                    <TableCell className="text-xs">{product.category?.name || 'Uncategorized'}</TableCell>
                    <TableCell className="text-xs">{product.supplier || 'N/A'}</TableCell>
                    <TableCell className="text-right text-xs">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs">
                        <Badge variant={product.quantity < (product.lowStockThreshold || 10) ? "destructive" : "secondary"}>
                        {product.quantity}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                            <Link href={`/inventory/${product.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/inventory/${product.id}/history`}>
                                <History className="mr-2 h-4 w-4" /> Stock History
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                            <Link href={`/inventory/${product.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Product
                            </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(product.id, product.name)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Product
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
