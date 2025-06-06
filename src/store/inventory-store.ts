
import { create } from 'zustand';
import type { Product, StockMovementType } from '@/lib/types'; // Added StockMovementType
import { toast } from 'sonner';
import { 
  fetchAllProductsAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  decreaseProductStockAction,
  increaseProductStockAction
} from '@/app/inventory/actions';

interface InventoryState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product | null>;
  updateProduct: (productId: string, updatedProductData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Product | null>;
  deleteProduct: (productId: string) => Promise<void>;
  // These direct stock manipulation functions might be deprecated in favor of actions that also handle movement logging
  // For now, they call the enhanced server actions.
  decreaseStock: (
    productId: string, 
    quantityToDecrease: number, 
    movementType: StockMovementType, 
    reason?: string, 
    referenceId?: string, 
    userId?: string
  ) => Promise<void>;
  increaseStock: (
    productId: string, 
    quantityToIncrease: number,
    movementType: StockMovementType,
    reason?: string,
    referenceId?: string,
    userId?: string
  ) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const appProducts = await fetchAllProductsAction(true);
      set({ products: appProducts, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch products:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMessage, isLoading: false });
      toast.error('Failed to load products.');
    }
  },
  getProductById: (productId) => {
    return get().products.find(p => p.id === productId);
  },
  addProduct: async (productData) => {
    set({ isLoading: true });
    try {
      const newAppProduct = await createProductAction(productData);
      set(state => ({ 
        products: [...state.products, newAppProduct].sort((a,b) => a.name.localeCompare(b.name)), 
        isLoading: false 
      }));
      toast.success(`Product "${newAppProduct.name}" added successfully.`);
      return newAppProduct;
    } catch (err) {
      console.error("Failed to add product:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMessage, isLoading: false });
      toast.error('Failed to add product.');
      return null;
    }
  },
  updateProduct: async (productId, updatedProductData) => {
    set({ isLoading: true });
    try {
      const updatedAppProduct = await updateProductAction(productId, updatedProductData);
      set(state => ({
        products: state.products.map(p => p.id === productId ? updatedAppProduct : p).sort((a,b) => a.name.localeCompare(b.name)),
        isLoading: false,
      }));
      toast.success(`Product "${updatedAppProduct.name}" updated successfully.`);
      return updatedAppProduct;
    } catch (err) {
      console.error("Failed to update product:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMessage, isLoading: false });
      toast.error('Failed to update product.');
      return null;
    }
  },
  deleteProduct: async (productId) => {
    try {
      const productToDelete = get().products.find(p => p.id === productId);
      await deleteProductAction(productId);
      set(state => ({
        products: state.products.filter(p => p.id !== productId),
      }));
      if (productToDelete) {
        toast.success(`"${productToDelete.name}" deleted successfully.`);
      } else {
        toast.success(`Product deleted successfully.`);
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMessage }); 
      toast.error('Failed to delete product.');
    }
  },
  // Updated to call the server action which handles logging
  decreaseStock: async (productId, quantityToDecrease, movementType, reason, referenceId, userId) => {
    try {
      const updatedAppProduct = await decreaseProductStockAction(productId, quantityToDecrease, movementType, reason, referenceId, userId);
      set(state => ({
        products: state.products.map(p => (p.id === productId ? updatedAppProduct : p)),
      }));
    } catch (err) {
      console.error("Failed to decrease stock in store:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(errorMessage); // Show specific error from action if available
      set(state => ({ ...state, error: errorMessage }));
    }
  },
  // Updated to call the server action which handles logging
  increaseStock: async (productId, quantityToIncrease, movementType, reason, referenceId, userId) => {
     try {
      const updatedAppProduct = await increaseProductStockAction(productId, quantityToIncrease, movementType, reason, referenceId, userId);
      set(state => ({
        products: state.products.map(p => (p.id === productId ? updatedAppProduct : p)),
      }));
    } catch (err) {
      console.error("Failed to increase stock in store:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(errorMessage);
      set(state => ({...state, error: errorMessage }));
    }
  },
}));
