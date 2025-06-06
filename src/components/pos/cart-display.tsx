
'use client';
import { useCartStore } from '@/store/cart-store';
import { useInventoryStore } from '@/store/inventory-store';
import type { CartItem, SaleDataForCreation, Customer, AppSettings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, Loader2, User as UserIcon, Percent, Truck, Tag as DiscountIcon, ChevronDown, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { findOrCreateCustomer, recordSale } from '@/app/pos/actions';
import { fetchAppSettings } from '@/app/admin/settings/actions'; // Import fetchAppSettings
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const MOCK_USER_ID = 'user_staff_charlie'; 

export function CartDisplay() {
  const { 
    items, removeItem, updateItemQuantity, clearCart, totalItems, 
    subtotal, grandTotal,
    discountAmount, setDiscountAmount,
    taxPercent, setTaxPercent, // taxPercent now comes from store, set by fetchAppSettings
    shippingCost, setShippingCost
  } = useCartStore();
  const { decreaseStock, getProductById } = useInventoryStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState(''); 
  const [promoCode, setPromoCode] = useState('');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadInitialSettings() {
      setIsLoadingSettings(true);
      try {
        const settings = await fetchAppSettings();
        setTaxPercent(settings.defaultTaxRate); // Initialize tax rate from settings
      } catch (error) {
        console.error("Failed to load app settings for POS:", error);
        toast.error("Could not load tax settings.");
        // Keep default taxPercent (0) from store if fetch fails
      } finally {
        setIsLoadingSettings(false);
      }
    }
    loadInitialSettings();
  }, [setTaxPercent]);


  const handleQuantityChange = (productId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity >= 0) { 
      updateItemQuantity(productId, newQuantity);
    }
  };
  
  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty. Please add items to proceed.");
      return;
    }
    setIsCheckingOut(true);
    for (const item of items) {
      const productInInventory = getProductById(item.productId);
      if (!productInInventory || productInInventory.quantity < item.quantity) {
        toast.error(`Not enough stock for ${item.name}. Available: ${productInInventory?.quantity || 0}. Required: ${item.quantity}`);
        setIsCheckingOut(false);
        return;
      }
    }
    let foundCustomer: Customer | null = null;
    
    if (customerName.trim()) { 
      try {
        foundCustomer = await findOrCreateCustomer(customerName.trim());
      } catch (error) {
        console.error("Failed to find or create customer:", error);
        toast.error("Could not process customer information. Please try again.");
        setIsCheckingOut(false);
        return;
      }
    }
    const currentSubtotalVal = subtotal();
    const saleDataPayload: SaleDataForCreation = {
      userId: MOCK_USER_ID, 
      cartItems: items,
      subtotal: currentSubtotalVal,
      discountAmount,
      taxPercent, // taxPercent from store, which was set from AppSettings
      shippingCost,
      customerName: customerName.trim() || undefined, 
      customerId: foundCustomer?.id || undefined,
    };
    try {
      const recordedSale = await recordSale(saleDataPayload);
      for (const item of items) {
        await decreaseStock(item.productId, item.quantity);
      }
      toast.success(`Sale ${recordedSale.saleNumber} successful!`, {
          description: `${customerName ? `Customer: ${customerName}. ` : ''}Total: $${recordedSale.grandTotal.toFixed(2)} for ${totalItems()} items.`
      });
      clearCart();
      setCustomerName('');
      setPromoCode('');
    } catch (error) {
        toast.error("An error occurred during checkout. Please try again.");
        console.error("Checkout error:", error);
    } finally {
        setIsCheckingOut(false);
    }
  };

  const currentSubtotal = subtotal();
  const taxableAmount = Math.max(0, currentSubtotal - discountAmount);
  const currentTaxAmount = taxableAmount * (taxPercent / 100); 
  const currentGrandTotal = grandTotal();

  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader className="border-b p-4">
        <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-headline">Cart</CardTitle>
            <Button variant="link" className="text-sm p-0 h-auto text-primary" onClick={() => { clearCart(); setCustomerName(''); setPromoCode(''); }} disabled={isCheckingOut || items.length === 0}>
                Clear
            </Button>
        </div>
        <CardDescription className="text-xs">CART DETAILS</CardDescription>
      </CardHeader>
      
      <ScrollArea className="flex-1">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="text-center py-12 px-4">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Your cart is empty.</p>
              <p className="text-sm text-muted-foreground">Add products from the selection panel.</p>
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">{totalItems()} Item{totalItems() > 1 ? 's' : ''} Selected</div>
          )}
            <ul className="divide-y">
              {items.map(item => (
                <li key={item.productId} className="flex items-start p-4 gap-3">
                  <Image
                    src={item.imageUrl || "https://placehold.co/64x64.png"}
                    alt={item.name}
                    width={56} 
                    height={56}
                    className="rounded-md object-cover border"
                    data-ai-hint="product thumbnail"
                  />
                  <div className="flex-grow">
                    <h4 className="font-semibold text-sm" title={item.name}>{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{(getProductById(item.productId)?.category || 'Item')} - Size: XS - Color: Blue</p> {/* Placeholder details */}
                    <p className="text-sm font-bold mt-0.5">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <div className="flex items-center">
                      <Button variant="outline" size="icon" className="h-7 w-7 rounded-r-none border-r-0" onClick={() => handleQuantityChange(item.productId, item.quantity, -1)} disabled={isCheckingOut}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            updateItemQuantity(item.productId, isNaN(val) || val < 0 ? 0 : val);
                        }}
                        className="h-7 w-10 text-center px-1 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 border-input"
                        min="0"
                        disabled={isCheckingOut}
                      />
                      <Button variant="outline" size="icon" className="h-7 w-7 rounded-l-none border-l-0" onClick={() => handleQuantityChange(item.productId, item.quantity, 1)} disabled={isCheckingOut}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                     <p className="text-sm font-semibold mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </li>
              ))}
            </ul>
        </CardContent>
      </ScrollArea>
      
      {items.length > 0 && (
        <CardFooter className="flex flex-col gap-3 p-4 border-t mt-auto">
          <Input 
            id="customerName" 
            type="text" 
            placeholder="Customer Name (Optional)" 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={isCheckingOut}
            className="h-10"
          />
          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="space-y-1">
              <Label htmlFor="discountAmount" className="text-xs">Discount Amount ($)</Label>
              <Input 
                id="discountAmount" 
                type="number" 
                placeholder="0.00" 
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                disabled={isCheckingOut}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
                <Label htmlFor="shippingCost" className="text-xs">Shipping Cost ($)</Label>
                <Input 
                    id="shippingCost" 
                    type="number" 
                    placeholder="0.00" 
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    disabled={isCheckingOut}
                    className="h-9"
                />
            </div>
          </div>
          
          <p className="text-sm font-medium self-start mt-2">Payment Details</p>
          <div className="w-full flex justify-between text-sm">
            <span className="text-muted-foreground">Sub Totals</span>
            <span>${currentSubtotal.toFixed(2)}</span>
          </div>
          <div className="w-full flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className={discountAmount > 0 ? "text-green-600" : ""}>-${discountAmount.toFixed(2)}</span>
          </div>
          <div className="w-full flex justify-between text-sm">
            <span className="text-muted-foreground">PPN {isLoadingSettings ? <Loader2 className="h-3 w-3 inline animate-spin"/> : `${taxPercent.toFixed(1)}%`}</span>
            <span>${currentTaxAmount.toFixed(2)}</span>
          </div>
           {shippingCost > 0 && (
            <div className="w-full flex justify-between text-sm text-muted-foreground">
              <span>Shipping</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
          )}
          <Separator className="my-1"/>
          <div className="w-full flex justify-between text-lg font-bold font-headline">
            <span>TOTAL</span>
            <span>${currentGrandTotal.toFixed(2)}</span>
          </div>

          <div className="flex w-full gap-2">
            <Input 
                id="promoCode" 
                type="text" 
                placeholder="Promo code" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={isCheckingOut}
                className="h-10 flex-grow"
            />
            <Button variant="outline" className="h-10" onClick={() => toast.info("Promo code applied (placeholder).")} disabled={isCheckingOut || !promoCode}>Apply</Button>
          </div>

          <Select defaultValue="visa" disabled={isCheckingOut}>
            <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="visa">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4"/> 
                        VISA
                    </div>
                </SelectItem>
                <SelectItem value="mastercard">
                     <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4"/>
                        Mastercard
                    </div>
                </SelectItem>
                <SelectItem value="cash">
                     <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4"/>
                        Cash
                    </div>
                </SelectItem>
            </SelectContent>
          </Select>

          <Button size="lg" className="w-full mt-2 h-12 text-base" onClick={handleCheckout} disabled={isCheckingOut || isLoadingSettings}>
            {isCheckingOut || isLoadingSettings ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Pay
            {isCheckingOut || isLoadingSettings ? "" : <span className="ml-1">➔</span>}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
