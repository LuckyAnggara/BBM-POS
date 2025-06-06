
'use client';
import { useCartStore } from '@/store/cart-store';
import { useInventoryStore } from '@/store/inventory-store';
import type { CartItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, Loader2, User as UserIcon, Percent, Truck, Tag as DiscountIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useState } from 'react';

export function CartDisplay() {
  const { 
    items, removeItem, updateItemQuantity, clearCart, totalItems, 
    subtotal, grandTotal,
    discountAmount, setDiscountAmount,
    taxPercent, setTaxPercent,
    shippingCost, setShippingCost
  } = useCartStore();
  const { decreaseStock, getProductById } = useInventoryStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');

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
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate payment

    try {
      for (const item of items) {
        await decreaseStock(item.productId, item.quantity);
      }

      toast.success("Checkout successful!", {
          description: `${customerName ? `Customer: ${customerName}. ` : ''}Total: $${grandTotal().toFixed(2)} for ${totalItems()} items.`
      });
      clearCart();
      setCustomerName('');
    } catch (error) {
        toast.error("An error occurred during checkout. Please try again.");
        console.error("Checkout error:", error);
    } finally {
        setIsCheckingOut(false);
    }
  };

  const currentSubtotal = subtotal();
  const currentTaxAmount = (Math.max(0, currentSubtotal - discountAmount)) * (taxPercent / 100);
  const currentGrandTotal = grandTotal();

  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-xl font-headline flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          Current Sale
        </CardTitle>
        <CardDescription>Review items and complete the transaction.</CardDescription>
      </CardHeader>
      
      <div className="p-4 border-b space-y-3">
        <div>
          <Label htmlFor="customerName" className="text-xs font-medium flex items-center gap-1 mb-1"><UserIcon className="h-3 w-3" />Customer Name (Optional)</Label>
          <Input 
            id="customerName" 
            placeholder="Enter customer name" 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={isCheckingOut}
            className="h-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="text-center py-12 px-4">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Your cart is empty.</p>
              <p className="text-sm text-muted-foreground">Add products from the selection panel.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map(item => (
                <li key={item.productId} className="flex items-center p-4 gap-4">
                  <Image
                    src={item.imageUrl || "https://placehold.co/64x64.png"}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="rounded-md object-cover border"
                    data-ai-hint="product thumbnail"
                  />
                  <div className="flex-grow">
                    <h4 className="font-semibold text-sm truncate" title={item.name}>{item.name}</h4>
                    <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                    <div className="flex items-center mt-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.productId, item.quantity, -1)} disabled={isCheckingOut}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            updateItemQuantity(item.productId, isNaN(val) || val < 0 ? 0 : val);
                        }}
                        className="h-7 w-12 text-center mx-1 px-1"
                        min="0"
                        disabled={isCheckingOut}
                      />
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.productId, item.quantity, 1)} disabled={isCheckingOut}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.productId)} disabled={isCheckingOut}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </ScrollArea>
      
      {items.length > 0 && (
        <CardFooter className="flex flex-col gap-3 p-4 border-t mt-auto">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full text-sm">
            <div>
              <Label htmlFor="discountAmount" className="text-xs flex items-center gap-1 mb-1"><DiscountIcon className="h-3 w-3"/>Discount ($)</Label>
              <Input 
                id="discountAmount" 
                type="number" 
                placeholder="0.00" 
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                disabled={isCheckingOut}
                className="h-8"
              />
            </div>
             <div>
              <Label htmlFor="taxPercent" className="text-xs flex items-center gap-1 mb-1"><Percent className="h-3 w-3"/>Tax (%)</Label>
              <Input 
                id="taxPercent" 
                type="number" 
                placeholder="0" 
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                disabled={isCheckingOut}
                className="h-8"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="shippingCost" className="text-xs flex items-center gap-1 mb-1"><Truck className="h-3 w-3"/>Shipping Cost ($)</Label>
              <Input 
                id="shippingCost" 
                type="number" 
                placeholder="0.00" 
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                disabled={isCheckingOut}
                className="h-8"
              />
            </div>
          </div>

          <Separator className="my-2"/>

          <div className="w-full flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${currentSubtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="w-full flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="w-full flex justify-between text-sm">
            <span>Tax ({taxPercent.toFixed(1)}%)</span>
            <span>${currentTaxAmount.toFixed(2)}</span>
          </div>
          {shippingCost > 0 && (
            <div className="w-full flex justify-between text-sm">
              <span>Shipping</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="w-full flex justify-between text-lg font-bold font-headline">
            <span>Total</span>
            <span>${currentGrandTotal.toFixed(2)}</span>
          </div>
          <Button size="lg" className="w-full mt-2" onClick={handleCheckout} disabled={isCheckingOut}>
            {isCheckingOut ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
            {isCheckingOut ? 'Processing...' : 'Proceed to Payment'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => { clearCart(); setCustomerName('');}} disabled={isCheckingOut}>
            Clear Cart & Form
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
