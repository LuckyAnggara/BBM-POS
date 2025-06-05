
import type { User as PrismaUser, Product as PrismaProduct, PurchaseOrder as PrismaPurchaseOrder, PurchaseOrderItem as PrismaPurchaseOrderItem, Role as PrismaRole, PurchaseOrderStatus as PrismaPurchaseOrderStatus, AppSettings as PrismaAppSettings } from '@prisma/client';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  costPrice?: number | null;
  supplier?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  tags?: string[];
  lowStockThreshold?: number | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

export type PurchaseOrderStatus = PrismaPurchaseOrderStatus;

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived?: number | null;
  unitCost: number;
  totalCost: number; // Calculated: quantityOrdered * unitCost
  product?: Product; // Optional: for displaying product details if needed
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  orderDate: string; // ISO date string
  expectedDeliveryDate?: string | null; // ISO date string
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  discountAmount?: number | null;
  shippingCost?: number | null;
  taxes?: number | null;
  totalAmount: number;
  notes?: string | null;
  createdById: string;
  createdBy?: User; // For displaying user info
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}


export type UserRole = PrismaRole;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLogin?: string | null; // ISO date string or null
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
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

export interface AppSettings extends Omit<PrismaAppSettings, 'createdAt' | 'updatedAt'> {
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
