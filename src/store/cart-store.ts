
import { create } from 'zustand';
import type { CartItem, Product } from '@/lib/types';
import { toast } from 'sonner';

interface CartState {
  items: CartItem[];
  discountAmount: number;
  taxPercent: number; // Stored as a whole number, e.g., 10 for 10%
  shippingCost: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  setDiscountAmount: (amount: number) => void;
  setTaxPercent: (percent: number) => void; // Action to set tax rate, will be called from component
  setShippingCost: (cost: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
  grandTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discountAmount: 0,
  taxPercent: 0, // Initialized to 0, will be updated from app settings
  shippingCost: 0,
  addItem: (product, quantity = 1) => {
    set(state => {
      const existingItem = state.items.find(item => item.productId === product.id);
      let newItems;
      if (existingItem) {
        newItems = state.items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            imageUrl: product.imageUrl,
          },
        ];
      }
      toast.success(`${product.name} added to cart.`);
      return { items: newItems };
    });
  },
  removeItem: (productId) => {
    set(state => {
      const itemToRemove = state.items.find(item => item.productId === productId);
      if (itemToRemove) {
         toast.info(`${itemToRemove.name} removed from cart.`);
      }
      return { items: state.items.filter(item => item.productId !== productId) };
    });
  },
  updateItemQuantity: (productId, quantity) => {
    set(state => {
      if (quantity <= 0) {
        const itemToRemove = state.items.find(item => item.productId === productId);
        if (itemToRemove) {
           toast.info(`${itemToRemove.name} removed from cart.`);
        }
        return { items: state.items.filter(item => item.productId !== productId) };
      }
      const itemToUpdate = state.items.find(item => item.productId === productId);
       if (itemToUpdate) {
           toast.info(`Quantity for ${itemToUpdate.name} updated.`);
        }
      return {
        items: state.items.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        ),
      };
    });
  },
  setDiscountAmount: (amount) => set({ discountAmount: Math.max(0, amount) }),
  setTaxPercent: (percent) => set({ taxPercent: Math.max(0, percent) }),
  setShippingCost: (cost) => set({ shippingCost: Math.max(0, cost) }),
  clearCart: () => {
    // Keep the taxPercent from settings, reset other cart-specific values
    const currentTax = get().taxPercent;
    set({ items: [], discountAmount: 0, shippingCost: 0, taxPercent: currentTax });
    toast.info('Cart cleared.');
  },
  totalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  subtotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
  grandTotal: () => {
    const currentSubtotal = get().subtotal();
    const currentDiscount = get().discountAmount;
    const currentTaxPercent = get().taxPercent;
    const currentShippingCost = get().shippingCost;

    const taxableAmount = Math.max(0, currentSubtotal - currentDiscount);
    const taxAmountValue = taxableAmount * (currentTaxPercent / 100);
    
    return Math.max(0, currentSubtotal - currentDiscount + taxAmountValue + currentShippingCost);
  },
}));
