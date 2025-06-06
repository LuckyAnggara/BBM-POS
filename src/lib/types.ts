
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
  CashTransaction as PrismaCashTransaction
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
  createdBy?: User; 
  createdAt: string; 
  updatedAt: string; 
}

export type UserRole = string;

export interface User {
  id: string;
  name: string;
  email: string;
  // password field should not be in client-side User type for security
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
  user?: User; 
  items: SaleItem[];
  status: SaleStatus; 
  paymentMethod?: string | null;
  cashTransactionId?: string | null;
  cashTransaction?: CashTransaction | null; // Optional for full data load
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
  user?: User;       
  createdAt: string; 
}

// POS Cash Management Types
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
  user?: User; // User who owns the session
  cashTransactions?: CashTransaction[]; // Transactions within this session
  createdAt: string;
  updatedAt: string;
}

export interface CashTransaction extends Omit<PrismaCashTransaction, 'createdAt' | 'posSession' | 'user' | 'amount' | 'type' | 'sale'> {
  type: CashTransactionType;
  amount: number;
  user?: User; // User who performed the transaction
  posSession?: PosSession; // The session this transaction belongs to
  sale?: Sale; // If this transaction is linked to a sale
  createdAt: string;
}

// Reports Types
export interface IncomeStatementData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  // operatingExpenses: number; // Future enhancement
  netIncome: number;
  startDate: string;
  endDate: string;
}
