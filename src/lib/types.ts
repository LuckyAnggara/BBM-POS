
import type { User as PrismaUser, Product as PrismaProduct, PurchaseOrder as PrismaPurchaseOrder, PurchaseOrderItem as PrismaPurchaseOrderItem, AppSettings as PrismaAppSettings, Customer as PrismaCustomer, Sale as PrismaSale, SaleItem as PrismaSaleItem, Category as PrismaCategory } from '@prisma/client';

export interface Category extends Omit<PrismaCategory, 'createdAt' | 'updatedAt'> {
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  // category: string; // Replaced by category relation
  quantity: number;
  price: number;
  costPrice?: number | null;
  supplier?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  tags?: string[];
  lowStockThreshold?: number | null;
  
  categoryId?: string | null;
  category?: Category | null; // For eager loading

  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  // categoryName?: string | null; // If needed in cart from Product.category.name
}

export type PurchaseOrderStatus = string;

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived?: number | null;
  unitCost: number;
  totalCost: number; 
  product?: Product; 
  createdAt: string; 
  updatedAt: string; 
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  orderDate: string; 
  expectedDeliveryDate?: string | null; 
  status: PurchaseOrderStatus; 
  items: PurchaseOrderItem[];
  discountAmount?: number | null;
  shippingCost?: number | null;
  taxes?: number | null;
  totalAmount: number;
  notes?: string | null;
  createdById: string;
  createdBy?: User; 
  createdAt: string; 
  updatedAt: string; 
}

export type UserRole = string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole; 
  avatarUrl?: string | null;
  isActive: boolean;
  lastLogin?: string | null; 
  createdAt: string; 
  updatedAt: string; 
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings extends Omit<PrismaAppSettings, 'createdAt' | 'updatedAt' | 'defaultTaxRate'> {
  defaultTaxRate: number; // Ensure this is number, Prisma model uses Float
  createdAt: string; 
  updatedAt: string; 
}

// POS and Sales Related Types
export interface Customer extends Omit<PrismaCustomer, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem extends Omit<PrismaSaleItem, 'createdAt' | 'updatedAt' | 'sale' | 'product'> {
  product?: Product; // For potential display purposes, though productId is the FK
  createdAt: string;
  updatedAt: string;
}

export interface Sale extends Omit<PrismaSale, 'createdAt' | 'updatedAt' | 'saleDate' | 'customer' | 'user' | 'items'> {
  saleDate: string; // ISO date string
  customer?: Customer | null;
  user?: User; // Cashier/Seller
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

// For creating a sale
export type SaleItemDataForCreation = Omit<SaleItem, 'id' | 'createdAt' | 'updatedAt' | 'saleId'>;

export type SaleDataForCreation = Omit<Sale, 'id' | 'saleNumber' | 'createdAt' | 'updatedAt' | 'items' | 'user' | 'customer' | 'saleDate'> & {
  customerId?: string; // Will pass customerId directly
  userId: string; // Will pass userId directly
  cartItems: CartItem[]; // For easier processing of cart items into SaleItemDataForCreation
};
