
import type {
  User as PrismaUser,
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
  createdById?: string | null; // Made optional as user context might be removed
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = string; // "ADMIN", "STAFF", "MANAGER"

// Application's User type. Adjusted after NextAuth removal.
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null; // Kept as it might be used for general avatar
  avatarUrl?: string | null;
  role?: UserRole | null;
  isActive?: boolean;
  lastLogin?: string | null;
  // emailVerified removed
  createdAt?: string;
  updatedAt?: string;
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
  userId?: string | null; // Made optional
  items: SaleItem[];
  status: SaleStatus;
  paymentMethod?: string | null;
  cashTransactionId?: string | null;
  cashTransaction?: CashTransaction | null;
  createdAt: string;
  updatedAt: string;
}

export type SaleItemDataForCreation = Omit<SaleItem, 'id' | 'createdAt' | 'updatedAt' | 'saleId'>;

export type SaleDataForCreation = Omit<Sale, 'id' | 'saleNumber' | 'createdAt' | 'updatedAt' | 'items' | 'user' | 'customer' | 'saleDate' | 'status' | 'cashTransaction' | 'userId'> & {
  customerId?: string;
  cartItems: CartItem[];
  paymentMethod: string;
  status?: SaleStatus;
  // userId is removed from this type, should be handled by the action if needed
};

export type StockMovementType = PrismaClientStockMovementType;
export const StockMovementTypeEnum = PrismaClientStockMovementType;

export interface StockMovement extends Omit<PrismaStockMovement, 'createdAt' | 'product' | 'user' | 'type'> {
  type: StockMovementType;
  product?: Product;
  user?: User;
  userId?: string | null; // Made optional
  createdAt: string;
}

export type PosSessionStatus = PrismaClientPosSessionStatus;
export const PosSessionStatusEnum = PrismaClientPosSessionStatus;

export type CashTransactionType = PrismaClientCashTransactionType;
export const CashTransactionTypeEnum = PrismaClientCashTransactionType;

export interface PosSession extends Omit<PrismaPosSession, 'startTime' | 'endTime' | 'createdAt' | 'updatedAt' | 'user' | 'cashTransactions' | 'startingCash' | 'countedCash' | 'expectedCashInDrawer' | 'totalSalesAmount' | 'totalRefundsAmount' | 'status' | 'userId'> {
  userId?: string | null; // Made optional
  startTime: string;
  endTime?: string | null;
  status: PosSessionStatus;
  startingCash: number;
  countedCash?: number | null;
  expectedCashInDrawer: number;
  cashDifference?: number | null; // Added for calculated difference
  totalSalesAmount: number;
  totalRefundsAmount: number;
  user?: User;
  cashTransactions?: CashTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface CashTransaction extends Omit<PrismaCashTransaction, 'createdAt' | 'posSession' | 'user' | 'amount' | 'type' | 'sale' | 'userId'> {
  userId?: string | null; // Made optional
  type: CashTransactionType;
  amount: number;
  user?: User;
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

export interface Expense extends Omit<PrismaExpense, 'createdAt' | 'updatedAt' | 'date' | 'amount' | 'user' | 'category' | 'userId'> {
  userId?: string | null; // Made optional
  date: string;
  amount: number;
  user?: User;
  category: ExpenseCategory;
  createdAt: string;
  updatedAt: string;
}
