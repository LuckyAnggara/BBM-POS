
import { create } from 'zustand';
import type { Product } from '@/lib/types';
import { toast } from 'sonner';
import { prisma } from '@/lib/prisma'; // Import Prisma client

interface InventoryState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  getProductById: (productId: string) => Product | undefined; // Remains sync for UI, data fetched once
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product | null>;
  updateProduct: (productId: string, updatedProductData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Product | null>;
  deleteProduct: (productId: string) => Promise<void>;
  decreaseStock: (productId: string, quantityToDecrease: number) => Promise<void>;
  increaseStock: (productId: string, quantityToIncrease: number) => Promise<void>;
}

// Helper to convert Prisma Product to App Product (handling tags JSON)
const mapPrismaProductToAppProduct = (prismaProduct: any): Product => {
  return {
    ...prismaProduct,
    costPrice: prismaProduct.costPrice ?? undefined,
    supplier: prismaProduct.supplier ?? undefined,
    description: prismaProduct.description ?? undefined,
    imageUrl: prismaProduct.imageUrl ?? undefined,
    lowStockThreshold: prismaProduct.lowStockThreshold ?? undefined,
    tags: prismaProduct.tags ? JSON.parse(prismaProduct.tags) : [],
    createdAt: prismaProduct.createdAt.toISOString(),
    updatedAt: prismaProduct.updatedAt.toISOString(),
  };
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const dbProducts = await prisma.product.findMany({
        orderBy: { name: 'asc' }
      });
      const appProducts = dbProducts.map(mapPrismaProductToAppProduct);
      set({ products: appProducts, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch products:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMessage, isLoading: false });
      toast.error('Failed to load products from database.');
    }
  },
  getProductById: (productId) => {
    return get().products.find(p => p.id === productId);
  },
  addProduct: async (productData) => {
    set({ isLoading: true });
    try {
      const { tags, ...restOfData } = productData;
      const newDbProduct = await prisma.product.create({
        data: {
          ...restOfData,
          tags: tags ? JSON.stringify(tags) : null,
          // Prisma handles id, createdAt, updatedAt automatically
        },
      });
      const newAppProduct = mapPrismaProductToAppProduct(newDbProduct);
      set(state => ({ products: [...state.products, newAppProduct].sort((a,b) => a.name.localeCompare(b.name)), isLoading: false }));
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
      const { tags, ...restOfData } = updatedProductData;
      const currentProduct = get().products.find(p => p.id === productId);
      if (!currentProduct) {
        throw new Error("Product not found for update");
      }

      const dataToUpdate: any = { ...restOfData };
      if (tags !== undefined) {
        dataToUpdate.tags = tags ? JSON.stringify(tags) : null;
      }
      
      const updatedDbProduct = await prisma.product.update({
        where: { id: productId },
        data: dataToUpdate,
      });
      const updatedAppProduct = mapPrismaProductToAppProduct(updatedDbProduct);
      
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
      await prisma.product.delete({
        where: { id: productId },
      });
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
      set({ error: errorMessage }); // Keep isLoading false on error for delete
      toast.error('Failed to delete product.');
    }
  },
  decreaseStock: async (productId, quantityToDecrease) => {
    try {
      const product = get().products.find(p => p.id === productId);
      if (!product) throw new Error("Product not found for stock decrease.");

      const newQuantity = Math.max(0, product.quantity - quantityToDecrease);
      
      const updatedDbProduct = await prisma.product.update({
        where: { id: productId },
        data: { quantity: newQuantity },
      });
      const updatedAppProduct = mapPrismaProductToAppProduct(updatedDbProduct);

      set(state => ({
        products: state.products.map(p => (p.id === productId ? updatedAppProduct : p)),
      }));
      // No toast here, usually handled by calling function (e.g., POS checkout)
    } catch (err) {
      console.error("Failed to decrease stock:", err);
      toast.error('Failed to update stock.');
       const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
       set(state => ({ ...state, error: errorMessage }));
    }
  },
  increaseStock: async (productId, quantityToIncrease) => {
     try {
      const product = get().products.find(p => p.id === productId);
      if (!product) throw new Error("Product not found for stock increase.");
      
      const newQuantity = product.quantity + quantityToIncrease;

      const updatedDbProduct = await prisma.product.update({
        where: { id: productId },
        data: { quantity: newQuantity },
      });
      const updatedAppProduct = mapPrismaProductToAppProduct(updatedDbProduct);

      set(state => ({
        products: state.products.map(p => (p.id === productId ? updatedAppProduct : p)),
      }));
      // No toast here, usually handled by calling function (e.g., PO receive)
    } catch (err) {
      console.error("Failed to increase stock:", err);
      toast.error('Failed to update stock.');
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      set(state => ({...state, error: errorMessage }));
    }
  },
}));
