
import { create } from 'zustand';
import type { Product } from '@/lib/types';
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
  decreaseStock: (productId: string, quantityToDecrease: number) => Promise<void>;
  increaseStock: (productId: string, quantityToIncrease: number) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const appProducts = await fetchAllProductsAction();
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
    // Optimistic UI update can be complex with server actions if ID is server-generated
    // For now, we'll wait for server response then refresh.
    // For a smoother UX, consider generating a temporary client-side ID or handling server response more granularly.
    set({ isLoading: true });
    try {
      const newAppProduct = await createProductAction(productData);
      // Instead of manually adding, refetch or update based on response for consistency
      // For simplicity here, we'll update the local store directly if successful
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
  decreaseStock: async (productId, quantityToDecrease) => {
    try {
      const updatedAppProduct = await decreaseProductStockAction(productId, quantityToDecrease);
      set(state => ({
        products: state.products.map(p => (p.id === productId ? updatedAppProduct : p)),
      }));
    } catch (err) {
      console.error("Failed to decrease stock:", err);
      toast.error('Failed to update stock.');
       const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
       set(state => ({ ...state, error: errorMessage }));
    }
  },
  increaseStock: async (productId, quantityToIncrease) => {
     try {
      const updatedAppProduct = await increaseProductStockAction(productId, quantityToIncrease);
      set(state => ({
        products: state.products.map(p => (p.id === productId ? updatedAppProduct : p)),
      }));
    } catch (err) {
      console.error("Failed to increase stock:", err);
      toast.error('Failed to update stock.');
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      set(state => ({...state, error: errorMessage }));
    }
  },
}));
