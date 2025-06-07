
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventoryStore } from '@/store/inventory-store';
import type { Product, PurchaseOrder as AppPurchaseOrder, PurchaseOrderItem as AppPurchaseOrderItem, PurchaseOrderStatus } from '@/lib/types';
import { purchaseOrderStatusOptions } from '@/lib/mock-data'; // Keep for UI options
import { toast } from 'sonner';
import { Save, ArrowLeft, PlusCircle, Trash2, CalendarIcon, Loader2, ChevronsUpDown, Check, AlertTriangle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchPurchaseOrderById, updatePurchaseOrder } from '../actions'; // Import server actions
import { usePageTitle } from '@/components/layout/page-title-context';

const purchaseOrderItemSchema = z.object({
  id: z.string().optional(), // For existing items
  productId: z.string().min(1, "Product selection is required"),
  productName: z.string(), 
  quantityOrdered: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitCost: z.coerce.number().min(0, "Unit cost must be non-negative"),
  quantityReceived: z.coerce.number().int().min(0).optional().nullable(),
});

export type PurchaseOrderItemFormValues = z.infer<typeof purchaseOrderItemSchema>;

const purchaseOrderSchema = z.object({
  poNumber: z.string().min(1, "PO Number is required"),
  supplierName: z.string().min(1, "Supplier name is required"),
  orderDate: z.date({ required_error: "Order date is required." }),
  expectedDeliveryDate: z.date().optional().nullable(),
  status: z.custom<PurchaseOrderStatus>((val) => purchaseOrderStatusOptions.includes(val as PurchaseOrderStatus), {
    message: "Invalid status value",
  }),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required."),
  discountAmount: z.coerce.number().min(0, "Discount must be non-negative").optional().or(z.literal('')),
  shippingCost: z.coerce.number().min(0, "Shipping cost must be non-negative").optional().or(z.literal('')),
  taxes: z.coerce.number().min(0, "Taxes must be non-negative").optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

export default function EditPurchaseOrderPage() {
  usePageTitle('Edit Purchase Order');
  const router = useRouter();
  const params = useParams();
  const poId = params.poId as string;

  const { products: inventoryProducts, fetchProducts, isLoading: inventoryLoading } = useInventoryStore();
  const [existingPO, setExistingPO] = useState<AppPurchaseOrder | null | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPO, setIsFetchingPO] = useState(true);
  const [comboboxOpenStates, setComboboxOpenStates] = useState<boolean[]>([]);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    // Default values will be overridden by existingPO data
  });
  
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const loadPOData = useCallback(async () => {
    if (!poId) return;
    setIsFetchingPO(true);
    try {
      await fetchProducts(); // Ensure products are available for combobox
      const poData = await fetchPurchaseOrderById(poId);
      setExistingPO(poData);
      if (poData) {
        form.reset({
          poNumber: poData.poNumber,
          supplierName: poData.supplierName,
          orderDate: parseISO(poData.orderDate),
          expectedDeliveryDate: poData.expectedDeliveryDate ? parseISO(poData.expectedDeliveryDate) : null,
          status: poData.status,
          items: poData.items.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            quantityOrdered: item.quantityOrdered,
            unitCost: item.unitCost,
            quantityReceived: item.quantityReceived ?? 0,
          })),
          discountAmount: poData.discountAmount ?? '',
          shippingCost: poData.shippingCost ?? '',
          taxes: poData.taxes ?? '',
          notes: poData.notes || '',
        });
        setComboboxOpenStates(poData.items.map(() => false));
      }
    } catch (error) {
      toast.error("Failed to load purchase order data.");
      setExistingPO(null); // Set to null on error to show not found message
    } finally {
      setIsFetchingPO(false);
    }
  }, [poId, form, fetchProducts]);

  useEffect(() => {
    loadPOData();
  }, [loadPOData]);


   useEffect(() => {
    // Ensure combobox states are initialized/updated when fields change (e.g. on reset or append)
    if (fields.length !== comboboxOpenStates.length) {
        setComboboxOpenStates(fields.map(() => false));
    }
  }, [fields.length, comboboxOpenStates.length]);

  const setComboboxState = (index: number, isOpen: boolean) => {
    setComboboxOpenStates(prev => {
        const newState = [...prev];
        if (newState[index] !== undefined) newState[index] = isOpen;
        return newState;
    });
  };

  const calculateSubtotal = (items: PurchaseOrderItemFormValues[]): number => {
    return items.reduce((sum, item) => sum + ((item.quantityOrdered || 0) * (item.unitCost || 0)), 0);
  };

  const onSubmit = async (data: PurchaseOrderFormValues) => {
    if (!existingPO) return;
    setIsSubmitting(true);
    try {
      await updatePurchaseOrder(existingPO.id, data);
      toast.success('Purchase Order updated successfully!');
      router.push(`/purchasing/${existingPO.id}`);
    } catch (error) {
      toast.error('Failed to update Purchase Order.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedItems = form.watch("items");
  const watchedDiscountAmount = form.watch("discountAmount");
  const watchedShippingCost = form.watch("shippingCost");
  const watchedTaxes = form.watch("taxes");

  const currentSubtotal = calculateSubtotal(watchedItems || []);
  const currentDiscount = Number(watchedDiscountAmount) || 0;
  const currentShipping = Number(watchedShippingCost) || 0;
  const currentTaxes = Number(watchedTaxes) || 0;
  const currentGrandTotal = currentSubtotal - currentDiscount + currentShipping + currentTaxes;

  if (isFetchingPO || inventoryLoading) { // Combined loading state
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4"> <Skeleton className="h-10 w-10 rounded-md" /> <div> <Skeleton className="h-8 w-64 mb-1" /> <Skeleton className="h-4 w-48" /> </div> </div>
            <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent className="space-y-4">{[...Array(3)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent className="space-y-4">{[...Array(2)].map((_,i) => <Skeleton key={i} className="h-20 w-full" />)}</CardContent><CardFooter className="border-t pt-4 flex justify-end"><Skeleton className="h-10 w-24" /></CardFooter></Card>
        </div>
    );
  }

  if (!existingPO) { // existingPO is null after attempting to fetch
     return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Purchase Order Not Found</h1>
        <p className="text-muted-foreground mb-4"> The Purchase Order you are trying to edit could not be found. </p>
        <Button onClick={() => router.push('/purchasing')}> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Purchase Orders </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 print:hidden">
        <Button variant="outline" size="icon" onClick={() => router.back()} disabled={isSubmitting}> <ArrowLeft className="h-4 w-4" /> </Button>
        <div> <h2 className="text-xl font-semibold">PO: {existingPO.poNumber}</h2> <p className="text-sm text-muted-foreground">Modify the details of this PO.</p> </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader> <CardTitle>PO Details</CardTitle> </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="poNumber" render={({ field }) => ( <FormItem> <FormLabel>PO Number</FormLabel> <FormControl><Input placeholder="e.g., PO-2024-0001" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="supplierName" render={({ field }) => ( <FormItem> <FormLabel>Supplier Name</FormLabel> <FormControl><Input placeholder="Supplier Company Name" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="orderDate" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Order Date</FormLabel> <Popover> <PopoverTrigger asChild> <FormControl> <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}> {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /> </Button> </FormControl> </PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"> <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /> </PopoverContent> </Popover> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="expectedDeliveryDate" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Expected Delivery Date (Optional)</FormLabel> <Popover> <PopoverTrigger asChild> <FormControl> <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}> {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /> </Button> </FormControl> </PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"> <Calendar mode="single" selected={field.value} onSelect={field.onChange} /> </PopoverContent> </Popover> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="status" render={({ field }) => ( <FormItem> <FormLabel>Status</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select PO status" /> </SelectTrigger> </FormControl> <SelectContent> {purchaseOrderStatusOptions.map(status => ( <SelectItem key={status} value={status}>{status}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader> <CardTitle>Order Items</CardTitle> <CardDescription>Modify products in this purchase order.</CardDescription> </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((itemField, index) => (
                <div key={itemField.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-end p-3 border rounded-md">
                  <FormField control={form.control} name={`items.${index}.productId`} render={({ field: controllerField }) => ( <FormItem className="flex flex-col"> <FormLabel>Product</FormLabel> <Popover open={comboboxOpenStates[index]} onOpenChange={(isOpen) => setComboboxState(index, isOpen)}> <PopoverTrigger asChild> <FormControl> <Button variant="outline" role="combobox" className={cn("w-full justify-between", !controllerField.value && "text-muted-foreground")} disabled={inventoryLoading}> {inventoryLoading ? "Loading..." : controllerField.value ? inventoryProducts.find(p => p.id === controllerField.value)?.name : "Select product"} <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /> </Button> </FormControl> </PopoverTrigger> <PopoverContent className="w-[--radix-popover-trigger-width] p-0"> <Command> <CommandInput placeholder="Search product..." /> <CommandList> <CommandEmpty>No product found.</CommandEmpty> <CommandGroup> {inventoryProducts.map((product) => ( <CommandItem value={product.name} key={product.id} onSelect={() => { form.setValue(`items.${index}.productId`, product.id); form.setValue(`items.${index}.productName`, product.name); form.setValue(`items.${index}.unitCost`, product.costPrice ?? 0); setComboboxState(index, false); }}> <Check className={cn("mr-2 h-4 w-4", product.id === controllerField.value ? "opacity-100" : "opacity-0")} /> {product.name} (SKU: {product.sku}) </CommandItem> ))} </CommandGroup> </CommandList> </Command> </PopoverContent> </Popover> <FormMessage /> </FormItem> )} />
                  <FormField control={form.control} name={`items.${index}.productName`} render={({ field: controllerField }) => (<FormItem className="hidden"><FormControl><Input {...controllerField} readOnly /></FormControl></FormItem>)} />
                  <FormField control={form.control} name={`items.${index}.quantityOrdered`} render={({ field: controllerField }) => ( <FormItem> <FormLabel>Quantity</FormLabel> <FormControl><Input type="number" placeholder="0" {...controllerField} /></FormControl> <FormMessage /> </FormItem> )} />
                  <FormField control={form.control} name={`items.${index}.unitCost`} render={({ field: controllerField }) => ( <FormItem> <FormLabel>Unit Cost</FormLabel> <FormControl><Input type="number" step="0.01" placeholder="0.00" {...controllerField} /></FormControl> <FormMessage /> </FormItem> )} />
                  <div className="text-sm"> <FormLabel>Total</FormLabel> <p className="font-medium pt-2"> ${((watchedItems[index]?.quantityOrdered || 0) * (watchedItems[index]?.unitCost || 0)).toFixed(2)} </p> </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive self-center" disabled={fields.length <= 1}> <Trash2 className="h-4 w-4" /> </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => { append({ productId: '', productName: '', quantityOrdered: 1, unitCost: 0, quantityReceived: 0 }); setComboboxOpenStates(prev => [...prev, false]); }} className="mt-2"> <PlusCircle className="mr-2 h-4 w-4" /> Add Item </Button>
              {form.formState.errors.items && typeof form.formState.errors.items === 'object' && !Array.isArray(form.formState.errors.items) && form.formState.errors.items.message && (  <p className="text-sm font-medium text-destructive">{form.formState.errors.items.message}</p> )}
            </CardContent>
            <CardFooter className="flex flex-col md:flex-row justify-between items-start gap-6 border-t pt-6 mt-4">
              <div className="w-full md:w-1/2 space-y-4">
                <FormField control={form.control} name="discountAmount" render={({ field }) => ( <FormItem> <FormLabel>Discount Amount (Optional)</FormLabel> <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="shippingCost" render={({ field }) => ( <FormItem> <FormLabel>Shipping Cost (Optional)</FormLabel> <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="taxes" render={({ field }) => ( <FormItem> <FormLabel>Taxes (Optional)</FormLabel> <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem> <FormLabel>Notes (Optional)</FormLabel> <FormControl><Textarea placeholder="Internal notes for this PO..." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </div>
              <div className="w-full md:w-auto flex flex-col items-end gap-1 self-end md:self-start">
                <div className="text-right w-full"> <p className="text-sm text-muted-foreground">Subtotal</p> <p className="text-lg font-semibold">${currentSubtotal.toFixed(2)}</p> </div>
                <div className="text-right w-full"> <p className="text-sm text-muted-foreground">Discount</p> <p className="text-lg font-semibold text-green-600">-${currentDiscount.toFixed(2)}</p> </div>
                <div className="text-right w-full"> <p className="text-sm text-muted-foreground">Shipping</p> <p className="text-lg font-semibold">${currentShipping.toFixed(2)}</p> </div>
                <div className="text-right w-full"> <p className="text-sm text-muted-foreground">Taxes</p> <p className="text-lg font-semibold">${currentTaxes.toFixed(2)}</p> </div>
                <div className="border-t w-full my-2"></div>
                <div className="text-right w-full"> <p className="text-sm text-muted-foreground">Grand Total</p> <p className="text-2xl font-bold font-headline">${currentGrandTotal.toFixed(2)}</p> </div>
                <div className="flex gap-2 mt-4 w-full md:w-auto"> <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="flex-grow md:flex-grow-0">Cancel</Button> <Button type="submit" disabled={isSubmitting || inventoryLoading || form.formState.isSubmitting} className="flex-grow md:flex-grow-0"> {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {isSubmitting ? 'Saving...' : 'Save Changes'} </Button> </div>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
