
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  costPrice?: number | null; // Prisma Float? maps to number | null
  supplier?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  tags?: string[]; // Will be stringified JSON in DB, parsed in app
  lowStockThreshold?: number | null;
  createdAt: string; // ISO date string from Prisma
  updatedAt: string; // ISO date string from Prisma
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
  supplierName: string; // Denormalized for display
  orderDate: string; // ISO date string
  expectedDeliveryDate?: string; // ISO date string
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'Shipped' | 'Partially Received' | 'Received' | 'Cancelled' | 'Closed';
  items: Array<{
    productId: string;
    productName: string; // Denormalized
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
  createdBy: string; // User ID
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff';
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string; // ISO date string
  createdAt: string; // ISO date string
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
