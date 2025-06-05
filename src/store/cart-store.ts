import { create } from 'zustand';
import type { CartItem, Product } from '@/lib/types';
import { toast } from 'sonner';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
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
  clearCart: () => {
    set({ items: [] });
    toast.info('Cart cleared.');
  },
  totalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  totalPrice: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
}));
