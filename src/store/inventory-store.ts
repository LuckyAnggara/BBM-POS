import { create } from 'zustand';
import type { Product } from '@/lib/types';
import { toast } from 'sonner';

interface InventoryState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (productId: string, updatedProductData: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];


export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    set({ products: mockProducts, isLoading: false });
    // toast.success('Products loaded successfully');
  },
  addProduct: async (productData) => {
    set({ isLoading: true });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const newProduct: Product = {
      ...productData,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(state => ({ products: [...state.products, newProduct], isLoading: false }));
    toast.success(`Product "${newProduct.name}" added successfully.`);
  },
  updateProduct: async (productId, updatedProductData) => {
    set({ isLoading: true });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    set(state => ({
      products: state.products.map(p =>
        p.id === productId ? { ...p, ...updatedProductData, updatedAt: new Date().toISOString() } : p
      ),
      isLoading: false,
    }));
    toast.success(`Product updated successfully.`);
  },
  deleteProduct: async (productId) => {
    set({ isLoading: true });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const productName = get().products.find(p => p.id === productId)?.name || 'Product';
    set(state => ({
      products: state.products.filter(p => p.id !== productId),
      isLoading: false,
    }));
    toast.success(`"${productName}" deleted successfully.`);
  },
}));
