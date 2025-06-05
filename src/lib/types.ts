
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
  createdAt: string; 
  updatedAt: string; 
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

export interface PurchaseOrder {
  id:string;
  poNumber: string;
  supplierId: string;
  supplierName: string; 
  orderDate: string; 
  expectedDeliveryDate?: string; 
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'Shipped' | 'Partially Received' | 'Received' | 'Cancelled' | 'Closed';
  items: Array<{
    productId: string;
    productName: string; 
    quantityOrdered: number;
    quantityReceived?: number;
    unitCost: number;
    totalCost: number;
  }>;
  discountAmount?: number;
  shippingCost?: number;
  taxes?: number;
  totalAmount: number;
  notes?: string;
  createdBy: string; 
  createdAt: string; 
  updatedAt: string; 
}

// Matches Prisma Role Enum
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole; // Use the enum
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
