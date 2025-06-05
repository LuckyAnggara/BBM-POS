
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useInventoryStore } from '@/store/inventory-store';
import type { Product, PurchaseOrder } from '@/lib/types';
import { mockPurchaseOrders } from '@/lib/mock-data';
import { toast } from 'sonner';
import { Save, ArrowLeft, PlusCircle, Trash2, CalendarIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEffect, useState }
 from 'react';

const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Product selection is required"),
  productName: z.string(), // Will be auto-filled
  quantityOrdered: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitCost: z.coerce.number().min(0, "Unit cost must be non-negative"),
});

export type PurchaseOrderItemFormValues = z.infer<typeof purchaseOrderItemSchema>;

const purchaseOrderSchema = z.object({
  poNumber: z.string().min(1, "PO Number is required (e.g., PO-YYYY-####)"),
  supplierName: z.string().min(1, "Supplier name is required"),
  orderDate: z.date({ required_error: "Order date is required." }),
  expectedDeliveryDate: z.date().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required in the purchase order."),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const { products: inventoryProducts, fetchProducts, isLoading: inventoryLoading } = useInventoryStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      poNumber: `PO-${new Date().getFullYear()}-${String(mockPurchaseOrders.length + 1).padStart(4, '0')}`,
      supplierName: '',
      orderDate: new Date(),
      expectedDeliveryDate: undefined,
      items: [{ productId: '', productName: '', quantityOrdered: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (data: PurchaseOrderFormValues) => {
    setIsSubmitting(true);
    try {
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0);
      const newPO: PurchaseOrder = {
        id: `po${Date.now()}`, // Simple ID
        poNumber: data.poNumber,
        supplierId: `sup${Date.now()}`, // Placeholder
        supplierName: data.supplierName,
        orderDate: data.orderDate.toISOString(),
        expectedDeliveryDate: data.expectedDeliveryDate?.toISOString(),
        status: 'Draft', // Default status
        items: data.items.map(item => ({
          ...item,
          totalCost: item.quantityOrdered * item.unitCost,
        })),
        totalAmount,
        createdBy: 'user-placeholder', // Placeholder
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockPurchaseOrders.push(newPO); // Add to the shared mock array
      toast.success('Purchase Order created successfully!');
      router.push('/purchasing');
    } catch (error) {
      toast.error('Failed to create Purchase Order.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Watch items to update product names
  const watchedItems = form.watch("items");

  useEffect(() => {
    watchedItems.forEach((item, index) => {
      if (item.productId) {
        const selectedProduct = inventoryProducts.find(p => p.id === item.productId);
        if (selectedProduct && selectedProduct.name !== item.productName) {
          form.setValue(`items.${index}.productName`, selectedProduct.name);
          if (selectedProduct.costPrice && item.unitCost === 0) { // Auto-fill cost price if not set
             form.setValue(`items.${index}.unitCost`, selectedProduct.costPrice);
          }
        }
      }
    });
  }, [watchedItems, inventoryProducts, form]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-semibold">Create New Purchase Order</h1>
          <p className="text-muted-foreground">Fill in the details to create a new PO.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>PO Details</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="poNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Number</FormLabel>
                    <FormControl><Input placeholder="e.g., PO-2024-0001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name</FormLabel>
                    <FormControl><Input placeholder="Supplier Company Name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Order Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedDeliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expected Delivery Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Add products to this purchase order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_100px_100px_auto] gap-3 items-end p-3 border rounded-md">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field: controllerField }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            controllerField.onChange(value);
                            const selectedProduct = inventoryProducts.find(p => p.id === value);
                            form.setValue(`items.${index}.productName`, selectedProduct?.name || '');
                            if (selectedProduct?.costPrice) {
                               form.setValue(`items.${index}.unitCost`, selectedProduct.costPrice);
                            }
                          }} 
                          defaultValue={controllerField.value}
                          disabled={inventoryLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={inventoryLoading ? "Loading..." : "Select product"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {inventoryProducts.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} (SKU: {product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`items.${index}.productName`}
                    render={({ field: controllerField }) => (
                       <FormItem className="hidden"> {/* Hidden, auto-filled */}
                        <FormLabel>Product Name (hidden)</FormLabel>
                        <FormControl><Input {...controllerField} readOnly /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantityOrdered`}
                    render={({ field: controllerField }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl><Input type="number" placeholder="0" {...controllerField} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitCost`}
                    render={({ field: controllerField }) => (
                      <FormItem>
                        <FormLabel>Unit Cost</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" {...controllerField} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <div className="text-sm">
                     <FormLabel>Total</FormLabel>
                     <p className="font-medium pt-2">
                       ${((watchedItems[index]?.quantityOrdered || 0) * (watchedItems[index]?.unitCost || 0)).toFixed(2)}
                     </p>
                   </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive" disabled={fields.length <= 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: '', productName: '', quantityOrdered: 1, unitCost: 0 })}
                className="mt-2"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
              {form.formState.errors.items && !form.formState.errors.items.length && (
                 <p className="text-sm font-medium text-destructive">{form.formState.errors.items.message}</p>
              )}
            </CardContent>
             <CardFooter className="flex justify-between items-center border-t pt-4">
                <div>
                    <p className="text-sm text-muted-foreground">Grand Total</p>
                    <p className="text-xl font-bold font-headline">
                        ${form.getValues('items').reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0).toFixed(2)}
                    </p>
                </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || inventoryLoading}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? 'Saving...' : 'Save Purchase Order'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
