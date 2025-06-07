
'use client';

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
import { Save, ArrowLeft, Loader2, PackagePlus, DollarSign, ListTree, Hash, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchAllCategoriesAction } from '@/app/inventory/actions';
import { usePageTitle } from '@/components/layout/page-title-context';

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Product name too long"),
  sku: z.string().min(1, "SKU is required").max(50, "SKU too long"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative").optional().nullable(),
  quantity: z.coerce.number().int().min(0, "Quantity must be a non-negative integer"),
  categoryId: z.string().optional().nullable(),
  supplier: z.string().max(100, "Supplier name too long").optional().nullable(),
  description: z.string().max(500, "Description too long").optional().nullable(),
  imageUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal('')),
  lowStockThreshold: z.coerce.number().int().min(0, "Low stock threshold must be non-negative").optional().nullable(),
  tags: z.string().optional().transform((val) => val ? val.split(',').map(tag => tag.trim()).filter(Boolean) : []),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddProductPage() {
  usePageTitle('Add New Product');
  const router = useRouter();
  const { addProduct } = useInventoryStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      costPrice: 0,
      quantity: 0,
      categoryId: null,
      supplier: '',
      description: '',
      imageUrl: '',
      lowStockThreshold: 10,
      tags: '', // Input as comma-separated string
    },
  });

  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true);
      try {
        const fetchedCategories = await fetchAllCategoriesAction();
        setCategories(fetchedCategories);
      } catch (error) {
        toast.error("Failed to load categories.");
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      // The schema transforms `tags` string to string[]
      const productDataForAction = {
        ...data,
        tags: data.tags, // This is already string[] due to transform
      };
      await addProduct(productDataForAction as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
      toast.success(`Product "${data.name}" added successfully!`);
      router.push('/inventory');
    } catch (error) {
      toast.error('Failed to add product.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 print:hidden">
        <Button variant="outline" size="icon" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {/* Title and description elements removed, handled by AppShell */}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Enter the basic details of the product.</CardDescription>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} disabled={isLoadingCategories}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Uncategorized</SelectItem>
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
              <CardTitle>Pricing & Stock</CardTitle>
              <CardDescription>Set the product's price and initial stock levels.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
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
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Quantity</FormLabel>
                  <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                   <FormDescription>This will be logged as initial stock.</FormDescription>
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
                <Button type="submit" disabled={isSubmitting || isLoadingCategories}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Saving...' : 'Save Product'}
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
