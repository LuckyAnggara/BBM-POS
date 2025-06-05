
'use client';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Filter, List, LayoutGrid, MoreHorizontal } from "lucide-react";
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
import Link from 'next/link';


const ProductCardItem = ({ product, onDeleteClick }: { product: Product; onDeleteClick: (productId: string) => void }) => (
  <Card className="flex flex-col">
    <CardHeader className="p-4">
      <div className="aspect-[3/2] w-full relative overflow-hidden rounded-md mb-2">
        <Image
          src={product.imageUrl || "https://placehold.co/300x200.png"}
          alt={product.name}
          layout="fill"
          objectFit="cover"
          data-ai-hint="product image"
        />
      </div>
      <CardTitle className="text-lg font-headline">{product.name}</CardTitle>
      <CardDescription>{product.category} - SKU: {product.sku}</CardDescription>
    </CardHeader>
    <CardContent className="p-4 flex-grow">
      <div className="flex justify-between items-center text-sm mb-1">
        <span className="text-muted-foreground">Price:</span>
        <span className="font-semibold">${product.price.toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Stock:</span>
        <Badge variant={product.quantity < (product.lowStockThreshold || 10) ? "destructive" : "secondary"}>
          {product.quantity}
        </Badge>
      </div>
    </CardContent>
    <CardFooter className="p-4 border-t">
      <Button variant="outline" size="sm" className="mr-2 w-full">
        <Edit className="mr-2 h-4 w-4" /> Edit
      </Button>
      <Button variant="destructive" size="sm" className="w-full" onClick={() => onDeleteClick(product.id)}>
        <Trash2 className="mr-2 h-4 w-4" /> Delete
      </Button>
    </CardFooter>
  </Card>
);


export default function InventoryPage() {
  const { products, fetchProducts, isLoading, deleteProduct } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (productId: string) => {
    toast.warning('Are you sure you want to delete this product?', {
      action: {
        label: 'Delete',
        onClick: () => deleteProduct(productId),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-semibold">Product Inventory</h1>
          <p className="text-muted-foreground">Manage your products, track stock levels, and view details.</p>
        </div>
        <Link href="/inventory/add" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products by name, SKU, category..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Placeholder for category filters */}
                <DropdownMenuCheckboxItem checked>All</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Fruits</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Bakery</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Dairy & Eggs</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-accent text-accent-foreground' : ''}>
              <List className="h-4 w-4"/>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-accent text-accent-foreground' : ''}>
              <LayoutGrid className="h-4 w-4"/>
            </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            viewMode === 'list' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[30px] ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-8 w-[70px] mx-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="p-4"><Skeleton className="aspect-[3/2] w-full rounded-md mb-2" /></CardHeader>
                    <CardContent className="p-4"><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardContent>
                    <CardFooter className="p-4 border-t"><Skeleton className="h-8 w-full" /></CardFooter>
                  </Card>
                ))}
              </div>
            )
          )}
          {!isLoading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No products found.</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters, or add a new product.</p>
            </div>
          )}
          {!isLoading && filteredProducts.length > 0 && (
            viewMode === 'list' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image
                          src={product.imageUrl || "https://placehold.co/64x64.png"}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="rounded-md object-cover"
                          data-ai-hint="product thumbnail"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={product.quantity < (product.lowStockThreshold || 10) ? "destructive" : "default"}>
                          {product.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> View/Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCardItem key={product.id} product={product} onDeleteClick={handleDelete} />
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

