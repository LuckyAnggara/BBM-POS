
'use server';

import { prisma } from '@/lib/prisma';
import type { Sale, Customer, User, Product, Category, StockMovementType, SaleStatus } from '@/lib/types';
import { StockMovementTypeEnum } from '@/lib/types';
// getSession import removed
import { revalidatePath } from 'next/cache';

const mapPrismaUserToAppUser = (prismaUser: any): User | undefined => {
  if (!prismaUser) return undefined;
  // Simplified User mapping as NextAuth is removed
  return {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    role: prismaUser.role, // Assuming role is still part of your Prisma User model
    avatarUrl: prismaUser.avatarUrl ?? undefined, // Or image from Prisma
    isActive: prismaUser.isActive,
    lastLogin: prismaUser.lastLogin?.toISOString() ?? null,
    createdAt: prismaUser.createdAt.toISOString(),
    updatedAt: prismaUser.updatedAt.toISOString(),
  };
};

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

const mapPrismaSaleToAppSale = (dbSale: any): Sale => {
  return {
    id: dbSale.id,
    saleNumber: dbSale.saleNumber,
    saleDate: dbSale.saleDate.toISOString(),
    customerId: dbSale.customerId,
    customerName: dbSale.customerName,
    userId: dbSale.userId, // This will be null or need a default if not set
    subtotal: dbSale.subtotal.toNumber(),
    discountAmount: dbSale.discountAmount.toNumber(),
    taxPercent: dbSale.taxPercent.toNumber(),
    taxAmount: dbSale.taxAmount.toNumber(),
    shippingCost: dbSale.shippingCost.toNumber(),
    grandTotal: dbSale.grandTotal.toNumber(),
    paymentMethod: dbSale.paymentMethod,
    status: dbSale.status as SaleStatus,
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
    user: dbSale.user ? mapPrismaUserToAppUser(dbSale.user) : undefined, // User mapping might be simplified
  };
};

export interface SalesHistoryFilters {
  startDate?: string;
  endDate?: string;
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
            product: { include: { category: true } }
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

export async function refundSaleAction(saleId: string): Promise<Sale> {
  // const session = await getSession(); // Removed
  // if (!session?.user?.id) { // Removed
  //   throw new Error("User not authenticated or session invalid for refund action.");
  // }
  // const userId = session.user.id; // Removed
  const userIdForDbOperations: string | undefined = undefined; // Placeholder

  return await prisma.$transaction(async (tx) => {
    const saleToRefund = await tx.sale.findUnique({
      where: { id: saleId },
      include: { items: { include: { product: true } } },
    });

    if (!saleToRefund) {
      throw new Error(`Sale with ID ${saleId} not found.`);
    }

    if (saleToRefund.status === 'Refunded') {
      throw new Error(`Sale ${saleToRefund.saleNumber} is already refunded.`);
    }
    if (saleToRefund.status === 'Cancelled') {
      throw new Error(`Sale ${saleToRefund.saleNumber} is cancelled and cannot be refunded.`);
    }

    const updatedSale = await tx.sale.update({
      where: { id: saleId },
      data: { status: 'Refunded' },
      include: {
        items: { include: { product: { include: { category: true } } } },
        customer: true,
        user: true,
      },
    });

    for (const item of saleToRefund.items) {
      if (!item.product) {
        console.warn(`Product details missing for item ID ${item.id} in sale ${saleId}. Skipping stock update for this item.`);
        continue;
      }
      
      const productToUpdate = await tx.product.findUnique({ where: { id: item.productId }});
      if (!productToUpdate) {
          throw new Error(`Product ${item.productName} (ID: ${item.productId}) not found for stock return.`);
      }

      const quantityBefore = productToUpdate.quantity;
      const quantityAfter = quantityBefore + item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: quantityAfter },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: StockMovementTypeEnum.RETURN_CUSTOMER,
          quantityChange: item.quantity,
          quantityBefore,
          quantityAfter,
          reason: `Return from Sale #${saleToRefund.saleNumber}`,
          referenceId: saleToRefund.id,
          userId: userIdForDbOperations, // May be undefined
        },
      });
    }

    revalidatePath('/sales/history');
    revalidatePath(`/sales/invoice/${saleId}`);
    revalidatePath('/inventory');
    saleToRefund.items.forEach(item => {
      revalidatePath(`/inventory/${item.productId}`);
      revalidatePath(`/inventory/${item.productId}/history`);
       if (item.product?.category?.name) {
            revalidatePath(`/inventory?category=${encodeURIComponent(item.product.category.name)}`);
        }
    });
    revalidatePath('/admin/products');

    return mapPrismaSaleToAppSale(updatedSale);
  }).catch(error => {
    console.error(`Failed to refund sale ${saleId}:`, error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('Could not process refund.');
  });
}
