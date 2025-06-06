
import type { User as PrismaUser, Product as PrismaProduct, PurchaseOrder as PrismaPurchaseOrder, PurchaseOrderItem as PrismaPurchaseOrderItem, AppSettings as PrismaAppSettings, Customer as PrismaCustomer, Sale as PrismaSale, SaleItem as PrismaSaleItem, Category as PrismaCategory, StockMovement as PrismaStockMovement } from '@prisma/client';
import { StockMovementType as PrismaClientStockMovementType } from '@prisma/client'; // Import enum as value (and type)

export interface Category extends Omit<PrismaCategory, 'createdAt' | 'updatedAt'> {
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  costPrice?: number | null;
  supplier?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  tags?: string[];
  lowStockThreshold?: number | null;
  
  categoryId?: string | null;
  category?: Category | null; 

  createdAt: string; 
  updatedAt: string; 
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  costPrice?: number | null; // Added to cart item to carry over to SaleItem
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
  defaultTaxRate: number; 
  createdAt: string; 
  updatedAt: string; 
}

// POS and Sales Related Types
export interface Customer extends Omit<PrismaCustomer, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem extends Omit<PrismaSaleItem, 'createdAt' | 'updatedAt' | 'sale' | 'product' | 'costPriceAtSale'> {
  product?: Product; 
  costPriceAtSale?: number | null; // Ensure this is number
  createdAt: string;
  updatedAt: string;
}

export type SaleStatus = 'PendingPayment' | 'Completed' | 'Refunded' | 'Cancelled' | string; // Added Refunded

export interface Sale extends Omit<PrismaSale, 'createdAt' | 'updatedAt' | 'saleDate' | 'customer' | 'user' | 'items' | 'status'> {
  saleDate: string; // ISO date string
  customer?: Customer | null;
  user?: User; // Cashier/Seller
  items: SaleItem[];
  status: SaleStatus; 
  paymentMethod?: string | null;
  createdAt: string;
  updatedAt: string;
}

// For creating a sale
export type SaleItemDataForCreation = Omit<SaleItem, 'id' | 'createdAt' | 'updatedAt' | 'saleId'>;

export type SaleDataForCreation = Omit<Sale, 'id' | 'saleNumber' | 'createdAt' | 'updatedAt' | 'items' | 'user' | 'customer' | 'saleDate' | 'status'> & {
  customerId?: string; 
  // userId: string; // Removed, will be taken from session
  cartItems: CartItem[]; 
  paymentMethod: string; 
  status?: SaleStatus; 
};

// Stock Movement Types
// Use the imported PrismaClientStockMovementType for both the type and the enum value
export type StockMovementType = PrismaClientStockMovementType;
export const StockMovementTypeEnum = PrismaClientStockMovementType;


export interface StockMovement extends Omit<PrismaStockMovement, 'createdAt' | 'product' | 'user' | 'type'> {
  type: StockMovementType;
  product?: Product; // Optional for display
  user?: User;       // Optional for display
  createdAt: string; // ISO date string
}
