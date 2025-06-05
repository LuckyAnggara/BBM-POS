'use client';
import { useCartStore } from '@/store/cart-store';
import type { CartItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export function CartDisplay() {
  const { items, removeItem, updateItemQuantity, clearCart, totalItems, totalPrice } = useCartStore();

  const handleQuantityChange = (productId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity >= 0) { // Allow quantity to be 0 to effectively remove item via input logic
      updateItemQuantity(productId, newQuantity);
    }
  };
  
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty. Please add items to proceed.");
      return;
    }
    // Placeholder for checkout logic
    toast.success("Proceeding to checkout...", {
        description: `Total: $${totalPrice().toFixed(2)} for ${totalItems()} items.`
    });
    // clearCart(); // Optionally clear cart after checkout attempt
  };

  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-xl font-headline flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          Current Sale
        </CardTitle>
        <CardDescription>Review items and complete the transaction.</CardDescription>
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
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.productId, item.quantity, -1)}>
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
                      />
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(item.productId, item.quantity, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.productId)}>
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
          <div className="w-full flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${totalPrice().toFixed(2)}</span>
          </div>
          <div className="w-full flex justify-between text-sm">
            <span>Tax (e.g. 10%)</span>
            <span>${(totalPrice() * 0.10).toFixed(2)}</span>
          </div>
          <Separator />
          <div className="w-full flex justify-between text-lg font-bold font-headline">
            <span>Total</span>
            <span>${(totalPrice() * 1.10).toFixed(2)}</span>
          </div>
          <Button size="lg" className="w-full mt-2" onClick={handleCheckout}>
            <CreditCard className="mr-2 h-5 w-5" /> Proceed to Payment
          </Button>
          <Button variant="outline" className="w-full" onClick={clearCart}>
            Clear Cart
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
