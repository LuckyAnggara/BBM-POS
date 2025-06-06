
'use server';

import { prisma } from '@/lib/prisma';
import type { Sale, Customer, User } from '@/lib/types';

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

// Helper to map Prisma Sale to App Sale
const mapPrismaSaleToAppSale = (dbSale: any): Sale => {
  return {
    id: dbSale.id,
    saleNumber: dbSale.saleNumber,
    saleDate: dbSale.saleDate.toISOString(),
    customerId: dbSale.customerId,
    customerName: dbSale.customerName,
    userId: dbSale.userId,
    subtotal: parseFloat(dbSale.subtotal),
    discountAmount: parseFloat(dbSale.discountAmount),
    taxPercent: parseFloat(dbSale.taxPercent),
    taxAmount: parseFloat(dbSale.taxAmount),
    shippingCost: parseFloat(dbSale.shippingCost),
    grandTotal: parseFloat(dbSale.grandTotal),
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
      unitPrice: parseFloat(item.unitPrice),
      totalPrice: parseFloat(item.totalPrice),
      costPriceAtSale: item.costPriceAtSale !== null ? parseFloat(item.costPriceAtSale) : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      // Product relation can be optionally included if needed for display here
      // product: item.product ? { ...item.product, price: parseFloat(item.product.price), costPrice: item.product.costPrice !== null ? parseFloat(item.product.costPrice) : null } : undefined,
    })),
    customer: mapPrismaCustomerToAppCustomer(dbSale.customer),
    user: mapPrismaUserToAppUser(dbSale.user),
  };
};

export async function fetchSalesHistory(): Promise<Sale[]> {
  try {
    const dbSales = await prisma.sale.findMany({
      include: {
        items: true, // Include sale items
        customer: true, // Include customer details
        user: true, // Include user (cashier) details
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
