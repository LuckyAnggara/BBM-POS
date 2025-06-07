
import type {
  User as PrismaUser, // Keep for direct Prisma interactions if any outside of NextAuth
  Product as PrismaProduct,
  PurchaseOrder as PrismaPurchaseOrder,
  PurchaseOrderItem as PrismaPurchaseOrderItem,
  AppSettings as PrismaAppSettings,
  Customer as PrismaCustomer,
  Sale as PrismaSale,
  SaleItem as PrismaSaleItem,
  Category as PrismaCategory,
  StockMovement as PrismaStockMovement,
  PosSession as PrismaPosSession,
  CashTransaction as PrismaCashTransaction,
  ExpenseCategory as PrismaExpenseCategory,
  Expense as PrismaExpense,
} from '@prisma/client';
import {
  StockMovementType as PrismaClientStockMovementType,
  CashTransactionType as PrismaClientCashTransactionType,
  PosSessionStatus as PrismaClientPosSessionStatus
} from '@prisma/client';

export interface Category extends Omit<PrismaCategory, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
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
  costPrice?: number | null;
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
  createdBy?: User; // Application User type
  createdAt: string;
  updatedAt: string;
}

export type UserRole = string; // "ADMIN", "STAFF", "MANAGER"

// Application's User type. NextAuth might use its own User type internally.
// This type is for what your application logic expects.
export interface User {
  id: string;
  name?: string | null; // NextAuth User can have nullable name
  email?: string | null; // NextAuth User can have nullable email
  image?: string | null; // NextAuth uses 'image' for avatar
  avatarUrl?: string | null; // Keep for compatibility or map from 'image'
  role?: UserRole | null; // Your custom role
  isActive?: boolean;
  lastLogin?: string | null; // Should be string (ISO date)
  emailVerified?: string | null; // string representation of DateTime from NextAuth
  // Avoid including password in client-side types
  createdAt?: string; // Should be string (ISO date)
  updatedAt?: string; // Should be string (ISO date)
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

export interface Customer extends Omit<PrismaCustomer, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem extends Omit<PrismaSaleItem, 'createdAt' | 'updatedAt' | 'sale' | 'product' | 'costPriceAtSale'> {
  product?: Product;
  costPriceAtSale?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type SaleStatus = 'PendingPayment' | 'Completed' | 'Refunded' | 'Cancelled' | string;

export interface Sale extends Omit<PrismaSale, 'createdAt' | 'updatedAt' | 'saleDate' | 'customer' | 'user' | 'items' | 'status' | 'cashTransaction' | 'cashTransactionId'> {
  saleDate: string;
  customer?: Customer | null;
  user?: User; // Application User type
  items: SaleItem[];
  status: SaleStatus;
  paymentMethod?: string | null;
  cashTransactionId?: string | null;
  cashTransaction?: CashTransaction | null;
  createdAt: string;
  updatedAt: string;
}

export type SaleItemDataForCreation = Omit<SaleItem, 'id' | 'createdAt' | 'updatedAt' | 'saleId'>;

export type SaleDataForCreation = Omit<Sale, 'id' | 'saleNumber' | 'createdAt' | 'updatedAt' | 'items' | 'user' | 'customer' | 'saleDate' | 'status' | 'cashTransaction'> & {
  customerId?: string;
  cartItems: CartItem[];
  paymentMethod: string;
  status?: SaleStatus;
};

export type StockMovementType = PrismaClientStockMovementType;
export const StockMovementTypeEnum = PrismaClientStockMovementType;

export interface StockMovement extends Omit<PrismaStockMovement, 'createdAt' | 'product' | 'user' | 'type'> {
  type: StockMovementType;
  product?: Product;
  user?: User; // Application User type
  createdAt: string;
}

export type PosSessionStatus = PrismaClientPosSessionStatus;
export const PosSessionStatusEnum = PrismaClientPosSessionStatus;

export type CashTransactionType = PrismaClientCashTransactionType;
export const CashTransactionTypeEnum = PrismaClientCashTransactionType;

export interface PosSession extends Omit<PrismaPosSession, 'startTime' | 'endTime' | 'createdAt' | 'updatedAt' | 'user' | 'cashTransactions' | 'startingCash' | 'countedCash' | 'expectedCashInDrawer' | 'totalSalesAmount' | 'totalRefundsAmount' | 'status'> {
  startTime: string;
  endTime?: string | null;
  status: PosSessionStatus;
  startingCash: number;
  countedCash?: number | null;
  expectedCashInDrawer: number;
  totalSalesAmount: number;
  totalRefundsAmount: number;
  user?: User; // Application User type
  cashTransactions?: CashTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface CashTransaction extends Omit<PrismaCashTransaction, 'createdAt' | 'posSession' | 'user' | 'amount' | 'type' | 'sale'> {
  type: CashTransactionType;
  amount: number;
  user?: User; // Application User type
  posSession?: PosSession;
  sale?: Sale;
  createdAt: string;
}

export interface IncomeStatementData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netIncome: number;
  startDate: string;
  endDate: string;
}

export interface ExpenseCategory extends Omit<PrismaExpenseCategory, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface Expense extends Omit<PrismaExpense, 'createdAt' | 'updatedAt' | 'date' | 'amount' | 'user' | 'category'> {
  date: string;
  amount: number;
  user?: User; // Application User type
  category: ExpenseCategory;
  createdAt: string;
  updatedAt: string;
}
