
'use server';

import { prisma } from '@/lib/prisma';
import type { Sale, Customer, User, Product, Category } from '@/lib/types';

// Helper to map Prisma User to App User type
const mapPrismaUserToAppUser = (prismaUser: any): User | undefined => {
  if (!prismaUser) return undefined;
  return {
    ...prismaUser,
    role: prismaUser.role,
    lastLogin: prismaUser.lastLogin?.toISOString() || null,
    createdAt: prismaUser.createdAt.toISOString(),
    updatedAt: prismaUser.updatedAt.toISOString(),
  };
};

// Helper to map Prisma Customer to App Customer
const mapPrismaCustomerToAppCustomer = (dbCustomer: any): Customer | null => {
  if (!dbCustomer) return null;
  return {
    ...dbCustomer,
    createdAt: dbCustomer.createdAt.toISOString(),
    updatedAt: dbCustomer.updatedAt.toISOString(),
  };
};

const mapPrismaProductToAppProductLocal = (prismaProduct: any): Product => {
  if (!prismaProduct) return undefined as unknown as Product;
  return {
    id: prismaProduct.id,
    name: prismaProduct.name,
    sku: prismaProduct.sku,
    quantity: prismaProduct.quantity,
    price: prismaProduct.price ? prismaProduct.price.toNumber() : 0,
    costPrice: prismaProduct.costPrice ? prismaProduct.costPrice.toNumber() : null,
    supplier: prismaProduct.supplier ?? undefined,
    description: prismaProduct.description ?? undefined,
    imageUrl: prismaProduct.imageUrl ?? undefined,
    lowStockThreshold: prismaProduct.lowStockThreshold ?? undefined,
    tags: prismaProduct.tags ? JSON.parse(prismaProduct.tags as string) : [],
    categoryId: prismaProduct.categoryId,
    category: prismaProduct.category ? {
        id: prismaProduct.category.id,
        name: prismaProduct.category.name,
        createdAt: prismaProduct.category.createdAt.toISOString(),
        updatedAt: prismaProduct.category.updatedAt.toISOString(),
    } : null,
    createdAt: prismaProduct.createdAt.toISOString(),
    updatedAt: prismaProduct.updatedAt.toISOString(),
  };
};

// Helper to map Prisma Sale to App Sale
const mapPrismaSaleToAppSale = (dbSale: any): Sale => {
  return {
    id: dbSale.id,
    saleNumber: dbSale.saleNumber,
    saleDate: dbSale.saleDate.toISOString(),
    customerId: dbSale.customerId,
    customerName: dbSale.customerName,
    userId: dbSale.userId,
    subtotal: dbSale.subtotal.toNumber(),
    discountAmount: dbSale.discountAmount.toNumber(),
    taxPercent: dbSale.taxPercent.toNumber(),
    taxAmount: dbSale.taxAmount.toNumber(),
    shippingCost: dbSale.shippingCost.toNumber(),
    grandTotal: dbSale.grandTotal.toNumber(),
    paymentMethod: dbSale.paymentMethod,
    status: dbSale.status,
    notes: dbSale.notes,
    createdAt: dbSale.createdAt.toISOString(),
    updatedAt: dbSale.updatedAt.toISOString(),
    items: dbSale.items.map((item: any) => ({
      id: item.id,
      saleId: item.saleId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      totalPrice: item.totalPrice.toNumber(),
      costPriceAtSale: item.costPriceAtSale !== null ? item.costPriceAtSale.toNumber() : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      product: item.product ? mapPrismaProductToAppProductLocal(item.product) : undefined,
    })),
    customer: mapPrismaCustomerToAppCustomer(dbSale.customer),
    user: mapPrismaUserToAppUser(dbSale.user),
  };
};

export interface SalesHistoryFilters {
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  status?: string;
  paymentMethod?: string;
}

export async function fetchSalesHistory(filters?: SalesHistoryFilters): Promise<Sale[]> {
  try {
    const whereClause: any = {};

    if (filters?.startDate) {
      whereClause.saleDate = { ...whereClause.saleDate, gte: new Date(filters.startDate) };
    }
    if (filters?.endDate) {
      const endDateObj = new Date(filters.endDate);
      // Set to end of the selected day for inclusive filtering
      endDateObj.setHours(23, 59, 59, 999);
      whereClause.saleDate = { ...whereClause.saleDate, lte: endDateObj };
    }
    if (filters?.status && filters.status !== 'All Statuses') {
      whereClause.status = filters.status;
    }
    if (filters?.paymentMethod && filters.paymentMethod !== 'All Methods') {
      whereClause.paymentMethod = filters.paymentMethod;
    }

    const dbSales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        items: { include: { product: { include: { category: true } } } },
        customer: true,
        user: true,
      },
      orderBy: {
        saleDate: 'desc',
      },
    });
    return dbSales.map(mapPrismaSaleToAppSale);
  } catch (error) {
    console.error('Failed to fetch sales history:', error);
    throw new Error('Could not fetch sales history.');
  }
}

export async function fetchSaleById(saleId: string): Promise<Sale | null> {
  try {
    const dbSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: { 
          include: { 
            product: { include: { category: true } } // Include product details for each item
          } 
        },
        customer: true,
        user: true,
      },
    });
    if (!dbSale) return null;
    return mapPrismaSaleToAppSale(dbSale);
  } catch (error) {
    console.error(`Failed to fetch sale with ID ${saleId}:`, error);
    throw new Error('Could not fetch sale details.');
  }
}
