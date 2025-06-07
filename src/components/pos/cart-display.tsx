
'use client';
import { useCartStore } from '@/store/cart-store';
import { useInventoryStore } from '@/store/inventory-store';
import { usePosSessionStore } from '@/store/pos-session-store'; // Import POS session store
import type { CartItem, SaleDataForCreation, Customer } from '@/lib/types'; 
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, Loader2, User as UserIcon, Percent, XCircle, DollarSign, Printer } from 'lucide-react'; // Added Printer
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { findOrCreateCustomer, recordSale } from '@/app/(pos)/actions';
import { fetchAppSettings } from '@/app/admin/settings/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter

export function CartDisplay() {
  const router = useRouter(); // Initialize useRouter
  const {
    items, removeItem, updateItemQuantity, clearCart, totalItems,
    subtotal, grandTotal,
    discountAmount, setDiscountAmount,
    taxPercent, setTaxPercent,
    shippingCost, setShippingCost,
    paymentMethod, setPaymentMethod
  } = useCartStore();
  const { getProductById } = useInventoryStore(); 
  const { activeSession, isLoading: isLoadingSession } = usePosSessionStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadInitialSettings() {
      setIsLoadingSettings(true);
      try {
        const settings = await fetchAppSettings();
        setTaxPercent(settings.defaultTaxRate);
      } catch (error) {
        console.error("Failed to load app settings for POS:", error);
        toast.error("Could not load tax settings.");
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
    if (!activeSession && paymentMethod === "Cash") {
        toast.error("No active POS session. Please start a shift to process cash sales.");
        setIsCheckingOut(false);
        return;
    }
    if (!activeSession && paymentMethod !== "Cash") {
        toast.warn("No active POS session. Sale will be recorded without cash drawer tracking.");
    }


    setIsCheckingOut(true);

    for (const item of items) {
      const productInInventory = getProductById(item.productId);
      if (!productInInventory || productInInventory.quantity < item.quantity) {
        toast.error("Not enough stock for " + item.name + ". Available: " + (productInInventory?.quantity || 0) + ". Required: " + item.quantity);
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
    const saleDataPayload: Omit<SaleDataForCreation, 'userId'> = {
      cartItems: items,
      subtotal: currentSubtotalVal,
      discountAmount,
      taxPercent,
      shippingCost,
      customerName: customerName.trim() || undefined,
      customerId: foundCustomer?.id || undefined,
      paymentMethod: paymentMethod,
    };
    try {
      const recordedSale = await recordSale(saleDataPayload);
      
      if (paymentMethod === 'Cash' && activeSession) {
        usePosSessionStore.getState().fetchActiveSession();
      }

      toast.success(`Sale ${recordedSale.saleNumber} successful!`, {
          description: `${customerName ? `Customer: ${customerName}. ` : ''}Total: $${recordedSale.grandTotal.toFixed(2)} for ${totalItems()} items.`,
          action: {
            label: 'Print Invoice',
            onClick: () => router.push(`/sales/invoice/${recordedSale.id}`),
          },
          duration: 8000, // Keep toast longer for action
      });
      clearCart();
      setCustomerName('');
      setPromoCode('');
    } catch (error) {
        if (error instanceof Error) {
            toast.error(error.message);
        } else {
            toast.error("An error occurred during checkout. Please try again.");
        }
        console.error("Checkout error:", error);
    } finally {
        setIsCheckingOut(false);
    }
  };

  const currentSubtotal = subtotal();
  const taxableAmount = Math.max(0, currentSubtotal - discountAmount);
  const currentTaxAmount = taxableAmount * (taxPercent / 100);
  const currentGrandTotal = grandTotal();
  
  const canCheckout = activeSession || paymentMethod !== 'Cash';


  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader className="border-b p-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-headline">Cart</CardTitle>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-auto" onClick={() => { clearCart(); setCustomerName(''); setPromoCode(''); }} disabled={isCheckingOut || items.length === 0}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
                </Button>
                 <Link href="/dashboard" legacyBehavior passHref>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Exit POS">
                       <XCircle className="h-4 w-4"/>
                    </Button>
                </Link>
            </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="text-center py-10 px-4">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              <p className="text-xs text-muted-foreground">Add products from the selection panel.</p>
            </div>
          ) : (
            <div className="p-3 text-xs text-muted-foreground">{totalItems()} Item{totalItems() > 1 ? 's' : ''} Selected</div>
          )}
            <ul className="divide-y">
              {items.map(item => (
                <li key={item.productId} className="flex items-start p-3 gap-2.5">
                  <Image
                    src={item.imageUrl || "https://placehold.co/48x48.png"}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded border object-cover"
                    data-ai-hint="product thumbnail"
                  />
                  <div className="flex-grow">
                    <h4 className="font-semibold text-xs leading-tight" title={item.name}>{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{(getProductById(item.productId)?.category?.name || 'Item')}</p>
                    <p className="text-xs font-bold mt-0.5">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <div className="flex items-center">
                      <Button variant="outline" size="icon" className="h-6 w-6 rounded-r-none border-r-0" onClick={() => handleQuantityChange(item.productId, item.quantity, -1)} disabled={isCheckingOut}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            updateItemQuantity(item.productId, isNaN(val) || val < 0 ? 0 : val);
                        }}
                        className="h-6 w-8 text-center px-0.5 text-xs rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 border-input"
                        min="0"
                        disabled={isCheckingOut}
                      />
                      <Button variant="outline" size="icon" className="h-6 w-6 rounded-l-none border-l-0" onClick={() => handleQuantityChange(item.productId, item.quantity, 1)} disabled={isCheckingOut}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                     <p className="text-xs font-semibold mt-0.5">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </li>
              ))}
            </ul>
        </CardContent>
      </ScrollArea>

      {items.length > 0 && (
        <CardFooter className="flex flex-col gap-2.5 p-3 border-t mt-auto">
          <Input
            id="customerName"
            type="text"
            placeholder="Customer Name (Optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={isCheckingOut}
            className="h-9 text-xs"
          />
          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="space-y-0.5">
              <Label htmlFor="discountAmount" className="text-xs">Discount ($)</Label>
              <Input
                id="discountAmount"
                type="number"
                placeholder="0.00"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                disabled={isCheckingOut}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-0.5">
                <Label htmlFor="shippingCost" className="text-xs">Shipping ($)</Label>
                <Input
                    id="shippingCost"
                    type="number"
                    placeholder="0.00"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    disabled={isCheckingOut}
                    className="h-8 text-xs"
                />
            </div>
          </div>

          <p className="text-xs font-medium self-start mt-1">Payment Details</p>
          <div className="w-full flex justify-between text-xs">
            <span className="text-muted-foreground">Sub Totals</span>
            <span>${currentSubtotal.toFixed(2)}</span>
          </div>
          <div className="w-full flex justify-between text-xs">
            <span className="text-muted-foreground">Discount</span>
            <span className={discountAmount > 0 ? "text-green-600" : ""}>-${discountAmount.toFixed(2)}</span>
          </div>
          <div className="w-full flex justify-between text-xs">
            <span className="text-muted-foreground">PPN {isLoadingSettings ? <Loader2 className="h-3 w-3 inline animate-spin"/> : taxPercent.toFixed(1) + '%'}</span>
            <span>${currentTaxAmount.toFixed(2)}</span>
          </div>
           {shippingCost > 0 && (
            <div className="w-full flex justify-between text-xs text-muted-foreground">
              <span>Shipping</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
          )}
          <Separator className="my-0.5"/>
          <div className="w-full flex justify-between text-base font-bold font-headline">
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
                className="h-9 text-xs flex-grow"
            />
            <Button variant="outline" className="h-9 text-xs px-3" onClick={() => toast.info("Promo code applied (placeholder).")} disabled={isCheckingOut || !promoCode}>Apply</Button>
          </div>

          <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isCheckingOut}>
            <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Cash">
                    <div className="flex items-center gap-2 text-xs">
                        <DollarSign className="h-3.5 w-3.5"/>
                        Cash
                    </div>
                </SelectItem>
                <SelectItem value="Credit Card">
                     <div className="flex items-center gap-2 text-xs">
                        <CreditCard className="h-3.5 w-3.5"/>
                        Credit Card
                    </div>
                </SelectItem>
                <SelectItem value="VISA">
                     <div className="flex items-center gap-2 text-xs">
                        <CreditCard className="h-3.5 w-3.5"/>
                        VISA
                    </div>
                </SelectItem>
                <SelectItem value="Mastercard">
                     <div className="flex items-center gap-2 text-xs">
                        <CreditCard className="h-3.5 w-3.5"/>
                        Mastercard
                    </div>
                </SelectItem>
            </SelectContent>
          </Select>

          <Button 
            size="lg" 
            className="w-full mt-1 h-10 text-sm" 
            onClick={handleCheckout} 
            disabled={isCheckingOut || isLoadingSettings || isLoadingSession || !canCheckout}
            title={!canCheckout && paymentMethod === "Cash" ? "Please start a POS session to process cash sales." : ""}
          >
            {(isCheckingOut || isLoadingSettings || isLoadingSession) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay
            {!(isCheckingOut || isLoadingSettings || isLoadingSession) && <span className="ml-1">➔</span>}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

    