'use client';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Filter, List, LayoutGrid, MoreHorizontal, Eye, PackageCheck, PackageX } from "lucide-react";
import Image from 'next/image';
import { useInventoryStore } from '@/store/inventory-store';
import type { Product } from '@/lib/types';
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
import { format } from 'date-fns';

export default function AdminProductManagementPage() {
  const { products, fetchProducts, isLoading, deleteProduct, updateProduct } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  // Admin specific product management might have different views or actions

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = (productId: string) => {
    toast.warning('Are you sure you want to PERMANENTLY delete this product?', {
      description: 'This action cannot be undone and will remove the product from inventory.',
      action: {
        label: 'Delete Permanently',
        onClick: () => deleteProduct(productId),
      },
      cancel: {
        label: 'Cancel',
      },
    });
  };
  
  const toggleProductAvailability = (product: Product) => {
    // This is a placeholder for a real 'isAvailable' field or similar
    // For now, we can simulate this by perhaps changing a tag or a custom field if it existed.
    // Let's assume we are toggling a hypothetical 'isArchived' status for admin.
    const newArchivedStatus = !(product.tags?.includes('archived'));
    const newTags = newArchivedStatus 
      ? [...(product.tags || []), 'archived'] 
      : product.tags?.filter(t => t !== 'archived');
    
    updateProduct(product.id, { tags: newTags });
    toast.success(`Product "${product.name}" ${newArchivedStatus ? 'archived' : 'unarchived'}.`);
  };


  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <CardTitle className="font-headline">Product Catalog Management</CardTitle>
          <CardDescription>Oversee and manage all products in the system. Set pricing, stock, and supplier details.</CardDescription>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products by name, SKU, category, supplier..."
              className="w-full rounded-lg bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {isLoading && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Img</TableHead>
                <TableHead>Name / SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-center">Status</TableHead>
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
                  <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[30px] ml-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-[80px] rounded-full mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-8 w-[30px] mx-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No products found in the catalog.</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or add a new product to the system.</p>
          </div>
        )}
        {!isLoading && filteredProducts.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Img</TableHead>
                <TableHead>Name / SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image
                      src={product.imageUrl || "https://placehold.co/40x40.png"}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                       data-ai-hint="product thumbnail"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                  </TableCell>
                  <TableCell className="text-xs">{product.category}</TableCell>
                  <TableCell className="text-xs">{product.supplier || 'N/A'}</TableCell>
                  <TableCell className="text-right text-xs">${product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs">${(product.costPrice || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs">
                     <Badge variant={product.quantity < (product.lowStockThreshold || 10) ? "destructive" : "secondary"}>
                        {product.quantity}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs">
                     <Badge variant={product.tags?.includes('archived') ? 'outline' : 'default'}
                           className={product.tags?.includes('archived') ? 'border-orange-500 text-orange-600 bg-orange-500/10' : 'bg-green-500/20 text-green-700 border-green-500/30'}>
                        {product.tags?.includes('archived') ? 'Archived' : 'Active'}
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" /> Edit Product
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => toggleProductAvailability(product)}>
                          {product.tags?.includes('archived') ? <PackageCheck className="mr-2 h-4 w-4" /> : <PackageX className="mr-2 h-4 w-4" />}
                           {product.tags?.includes('archived') ? 'Unarchive' : 'Archive'} Product
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
  );
}
