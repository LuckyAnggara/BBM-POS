
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventoryStore } from '@/store/inventory-store';
import type { Product, Category } from '@/lib/types';
import { toast } from 'sonner';
import { Save, ArrowLeft, Loader2, EditIcon, DollarSign, ListTree, Hash, Layers, AlertTriangle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAllCategoriesAction } from '@/app/inventory/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageTitle } from '@/components/layout/page-title-context';

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Product name too long"),
  sku: z.string().min(1, "SKU is required").max(50, "SKU too long"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative").optional().nullable(),
  // Quantity is not directly editable here; managed via stock movements
  categoryId: z.string().optional().nullable(),
  supplier: z.string().max(100, "Supplier name too long").optional().nullable(),
  description: z.string().max(500, "Description too long").optional().nullable(),
  imageUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal('')),
  lowStockThreshold: z.coerce.number().int().min(0, "Low stock threshold must be non-negative").optional().nullable(),
  tags: z.string().optional().transform((val) => val ? val.split(',').map(tag => tag.trim()).filter(Boolean) : []),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProductPage() {
  usePageTitle('Edit Product');
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const { getProductById, updateProduct, fetchProducts, products: inventoryProducts } = useInventoryStore();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    // Default values will be set once product data is loaded
  });

  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingProduct(true);
      setIsLoadingCategories(true);

      if (inventoryProducts.length === 0) {
        await fetchProducts(); // Fetch all products if store is empty
      }
      
      const fetchedProduct = getProductById(productId);
      setProduct(fetchedProduct);
      
      if (fetchedProduct) {
        form.reset({
          name: fetchedProduct.name,
          sku: fetchedProduct.sku,
          price: fetchedProduct.price,
          costPrice: fetchedProduct.costPrice || null,
          categoryId: fetchedProduct.categoryId || null,
          supplier: fetchedProduct.supplier || '',
          description: fetchedProduct.description || '',
          imageUrl: fetchedProduct.imageUrl || '',
          lowStockThreshold: fetchedProduct.lowStockThreshold || 10,
          tags: fetchedProduct.tags ? fetchedProduct.tags.join(', ') : '',
        });
      }
      setIsLoadingProduct(false);

      try {
        const fetchedCategories = await fetchAllCategoriesAction();
        setCategories(fetchedCategories);
      } catch (error) {
        toast.error("Failed to load categories.");
      } finally {
        setIsLoadingCategories(false);
      }
    }

    if (productId) {
      loadInitialData();
    }
  }, [productId, getProductById, form, fetchProducts, inventoryProducts.length]);

  const onSubmit = async (data: ProductFormValues) => {
    if (!product) return;
    setIsSubmitting(true);
    try {
      // The schema transforms `tags` string to string[]
      const productDataForAction = {
        ...data,
        tags: data.tags, // This is already string[] due to transform
      };
      await updateProduct(product.id, productDataForAction as Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>);
      toast.success(`Product "${data.name}" updated successfully!`);
      router.push(`/inventory/${product.id}`);
    } catch (error) {
      toast.error('Failed to update product.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const pageIsLoading = isLoadingProduct || isLoadingCategories;

  if (pageIsLoading && product === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div> <Skeleton className="h-8 w-64 mb-1" /> <Skeleton className="h-4 w-48" /> </div>
        </div>
        <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent className="space-y-4">{[...Array(3)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent className="space-y-4">{[...Array(2)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent><CardFooter className="border-t pt-4 flex justify-end"><Skeleton className="h-10 w-24" /></CardFooter></Card>
      </div>
    );
  }

  if (!product && !isLoadingProduct) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-4"> The product you are trying to edit (ID: {productId}) could not be found. </p>
        <Button onClick={() => router.push('/inventory')}> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 print:hidden">
        <Button variant="outline" size="icon" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {/* Main title and description are now in AppShell Header */}
        <div>
          <h2 className="text-xl font-semibold">Product: {product?.name || 'Loading...'}</h2>
          <p className="text-sm text-muted-foreground">Modify the details for this product.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Update the basic details of the product.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Organic Apples" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                  <FormControl><Input placeholder="e.g., ORG-APP-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoadingCategories}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select a category"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Uncategorized</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="supplier" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g., Fresh Farms Inc." {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="Detailed description of the product..." {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl><Input type="url" placeholder="https://example.com/image.png" {...field} value={field.value ?? ''} /></FormControl>
                   <FormDescription>Link to an image of the product.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & Stock Alert</CardTitle>
              <CardDescription>Update product's price and stock alert threshold. Current stock is managed via movements.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
               <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Price</FormLabel>
                   <FormControl>
                    <div className="relative">
                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-8"/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="costPrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Price (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} className="pl-8"/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lowStockThreshold" render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Stock Threshold</FormLabel>
                  <FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''} /></FormControl>
                  <FormDescription>Alert when stock drops to this level.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
               <FormItem>
                 <FormLabel>Current Stock</FormLabel>
                 <Input type="number" value={product?.quantity ?? 0} disabled className="bg-muted/50" />
                 <FormDescription>Managed via Stock Movements.</FormDescription>
               </FormItem>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent>
               <FormField control={form.control} name="tags" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g., organic, fruit, popular" {...field} /></FormControl>
                  <FormDescription>Comma-separated list of tags.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || pageIsLoading}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
