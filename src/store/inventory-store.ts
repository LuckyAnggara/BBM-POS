
import { create } from 'zustand';
import type { Product } from '@/lib/types';
import { toast } from 'sonner';

interface InventoryState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (productId: string, updatedProductData: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  decreaseStock: (productId: string, quantityToDecrease: number) => Promise<void>;
}

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Apples',
    sku: 'ORG-APP-001',
    category: 'Fruits',
    quantity: 150,
    price: 2.99,
    costPrice: 1.50,
    supplier: 'Fresh Farms Inc.',
    description: 'Crisp and delicious organic apples, perfect for snacking or baking.',
    imageUrl: 'https://placehold.co/300x200.png',
    tags: ['organic', 'fruit', 'healthy'],
    lowStockThreshold: 20,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
  },
  {
    id: '2',
    name: 'Whole Wheat Bread',
    sku: 'WW-BRD-002',
    category: 'Bakery',
    quantity: 75,
    price: 4.50,
    costPrice: 2.20,
    supplier: 'Artisan Bakers Co.',
    description: 'Freshly baked whole wheat bread, rich in fiber.',
    imageUrl: 'https://placehold.co/300x200.png',
    tags: ['bakery', 'bread', 'whole wheat'],
    lowStockThreshold: 10,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: '3',
    name: 'Free-Range Eggs (Dozen)',
    sku: 'FR-EGG-003',
    category: 'Dairy & Eggs',
    quantity: 100,
    price: 5.99,
    costPrice: 3.00,
    supplier: 'Happy Hens Farm',
    description: 'Grade A large free-range eggs.',
    imageUrl: 'https://placehold.co/300x200.png',
    tags: ['eggs', 'dairy', 'free-range'],
    lowStockThreshold: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];


export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  fetchProducts: async () => {
    if (get().products.length > 0 && !get().isLoading) return; // Avoid refetch if already loaded unless forced
    set({ isLoading: true, error: null });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700));
    set({ products: mockProducts, isLoading: false });
    // toast.success('Products loaded successfully');
  },
  getProductById: (productId) => {
    return get().products.find(p => p.id === productId);
  },
  addProduct: async (productData) => {
    set({ isLoading: true });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const newProduct: Product = {
      ...productData,
      id: String(Date.now()), // Simple ID generation for mock
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(state => ({ products: [...state.products, newProduct], isLoading: false }));
    mockProducts.push(newProduct); // Keep mock data in sync for this session
    toast.success(`Product "${newProduct.name}" added successfully.`);
  },
  updateProduct: async (productId, updatedProductData) => {
    set({ isLoading: true });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    let productName = 'Product';
    set(state => ({
      products: state.products.map(p => {
        if (p.id === productId) {
          productName = updatedProductData.name || p.name;
          return { ...p, ...updatedProductData, updatedAt: new Date().toISOString() };
        }
        return p;
      }),
      isLoading: false,
    }));
    // Update mockProducts array as well
    const mockIndex = mockProducts.findIndex(p => p.id === productId);
    if (mockIndex !== -1) {
      mockProducts[mockIndex] = { ...mockProducts[mockIndex], ...updatedProductData, updatedAt: new Date().toISOString() };
    }
    toast.success(`Product "${productName}" updated successfully.`);
  },
  deleteProduct: async (productId) => {
    // set({ isLoading: true }); // Deleting shouldn't feel like loading
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    const productName = get().products.find(p => p.id === productId)?.name || 'Product';
    set(state => ({
      products: state.products.filter(p => p.id !== productId),
      // isLoading: false,
    }));
    const mockIndex = mockProducts.findIndex(p => p.id === productId);
    if (mockIndex !== -1) {
      mockProducts.splice(mockIndex, 1);
    }
    toast.success(`"${productName}" deleted successfully.`);
  },
  decreaseStock: async (productId, quantityToDecrease) => {
    // No need to set isLoading for this, it should be a quick background update
    // Simulate API call delay if needed, but usually not for stock updates
    // await new Promise(resolve => setTimeout(resolve, 100)); 
    set(state => {
      const product = state.products.find(p => p.id === productId);
      if (product) {
        const newQuantity = Math.max(0, product.quantity - quantityToDecrease); // Ensure quantity doesn't go below 0
        // if (product.quantity - quantityToDecrease < 0) {
        //   toast.warning(`Not enough stock for ${product.name}. Stock set to 0.`);
        // }
        
        const updatedProducts = state.products.map(p =>
          p.id === productId ? { ...p, quantity: newQuantity, updatedAt: new Date().toISOString() } : p
        );

        // Update mockProducts array as well
        const mockIndex = mockProducts.findIndex(p => p.id === productId);
        if (mockIndex !== -1) {
          mockProducts[mockIndex] = { ...mockProducts[mockIndex], quantity: newQuantity, updatedAt: new Date().toISOString() };
        }
        // console.log(`Stock for ${product.name} decreased by ${quantityToDecrease}. New quantity: ${newQuantity}`);
        return { products: updatedProducts };
      }
      return state; // No change if product not found
    });
    // No toast here, POS checkout will give overall success
  },
}));
