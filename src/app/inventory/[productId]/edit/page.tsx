
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventoryStore } from '@/store/inventory-store';
import type { Product, Category } from '@/lib/types';
import { toast } from 'sonner';
import { Save, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchAllCategoriesAction } from '../../actions'; // Fetch categories

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string().optional(), // Changed from category to categoryId
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  quantity: z.coerce.number().int().min(0, 'Quantity must be a non-negative integer'),
  costPrice: z.coerce.number().min(0, 'Cost price must be a positive number').optional().or(z.literal('')),
  supplier: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  lowStockThreshold: z.coerce.number().int().min(0, 'Low stock threshold must be non-negative').optional().or(z.literal('')),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const { products, fetchProducts, getProductById, updateProduct } = useInventoryStore();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      categoryId: '',
      price: 0,
      quantity: 0,
      costPrice: '',
      supplier: '',
      description: '',
      imageUrl: '',
      lowStockThreshold: '',
    },
  });

  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingCategories(true);
      if (products.length === 0) {
        await fetchProducts(); // Fetch products if store is empty
      }
      try {
        const fetchedCategories = await fetchAllCategoriesAction();
        setCategories(fetchedCategories);
      } catch (error) {
        toast.error("Failed to load categories for dropdown.");
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadInitialData();
  }, [fetchProducts, products.length]);


  useEffect(() => {
    if (productId && products.length > 0) {
      const foundProduct = getProductById(productId);
      setProduct(foundProduct);
      if (foundProduct) {
        form.reset({
          name: foundProduct.name,
          sku: foundProduct.sku,
          categoryId: foundProduct.categoryId || '', // Use categoryId
          price: foundProduct.price,
          quantity: foundProduct.quantity,
          costPrice: foundProduct.costPrice ?? '',
          supplier: foundProduct.supplier ?? '',
          description: foundProduct.description ?? '',
          imageUrl: foundProduct.imageUrl ?? '',
          lowStockThreshold: foundProduct.lowStockThreshold ?? '',
        });
      }
    }
  }, [productId, products, getProductById, form]);

  const onSubmit = async (data: ProductFormValues) => {
    if (!product) return;
    setIsSubmitting(true);
    try {
      const updatedData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>> = {
        ...data,
        price: Number(data.price),
        quantity: Number(data.quantity),
        costPrice: data.costPrice !== '' && data.costPrice !== undefined ? Number(data.costPrice) : undefined,
        lowStockThreshold: data.lowStockThreshold !== '' && data.lowStockThreshold !== undefined ? Number(data.lowStockThreshold) : undefined,
        imageUrl: data.imageUrl || undefined,
        categoryId: data.categoryId || undefined,
      };
      await updateProduct(product.id, updatedData);
      toast.success('Product updated successfully!');
      router.push(`/inventory/${product.id}`);
    } catch (error) {
      toast.error('Failed to update product.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (product === undefined || isLoadingCategories) { 
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
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
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
          The product you are trying to edit could not be found.
        </p>
        <Button onClick={() => router.push('/inventory')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
           <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-semibold">Edit Product</h1>
          <p className="text-muted-foreground">
            Update the details for "{product.name}".
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Modify the product details below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Organic Apples" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ORG-APP-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCategories}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select a category"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                        <SelectItem value=""><em>Uncategorized</em></SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Product description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://placehold.co/300x200.png" {...field} />
                    </FormControl>
                    <FormDescription>Enter a direct link to the product image.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price ($) (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Threshold (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="e.g., 10" {...field} />
                      </FormControl>
                      <FormDescription>Get alerts when stock falls below this level.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fresh Farms Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2 py-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting || isLoadingCategories}>
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
