
'use server';

import { prisma } from '@/lib/prisma';
import type { PurchaseOrder as AppPurchaseOrder, PurchaseOrderItem as AppPurchaseOrderItem, PurchaseOrderStatus, StockMovementTypeEnum, Product, Category, User as AppUser } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { PurchaseOrderFormValues } from './create/page'; 
import { increaseProductStockAction } from '@/app/inventory/actions';
// getSession import removed

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


const mapPrismaUserToAppUser = (prismaUser: any): AppUser | undefined => {
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


const mapPrismaPOToAppPO = (dbPO: any): AppPurchaseOrder => {
  return {
    id: dbPO.id,
    poNumber: dbPO.poNumber,
    supplierName: dbPO.supplierName,
    orderDate: dbPO.orderDate.toISOString(),
    expectedDeliveryDate: dbPO.expectedDeliveryDate?.toISOString() || null,
    status: dbPO.status as PurchaseOrderStatus,
    discountAmount: dbPO.discountAmount ? dbPO.discountAmount.toNumber() : null,
    shippingCost: dbPO.shippingCost ? dbPO.shippingCost.toNumber() : null,
    taxes: dbPO.taxes ? dbPO.taxes.toNumber() : null,
    totalAmount: dbPO.totalAmount.toNumber(),
    notes: dbPO.notes ?? null,
    createdById: dbPO.createdById, // This will be null or need a default if not set
    createdBy: dbPO.createdBy ? mapPrismaUserToAppUser(dbPO.createdBy) : undefined,
    createdAt: dbPO.createdAt.toISOString(),
    updatedAt: dbPO.updatedAt.toISOString(),
    items: dbPO.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityReceived ?? null,
      unitCost: item.unitCost.toNumber(),
      totalCost: item.totalCost.toNumber(),
      product: item.product ? mapPrismaProductToAppProductLocal(item.product) : undefined,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
};


export async function fetchPurchaseOrders(): Promise<AppPurchaseOrder[]> {
  try {
    const dbPOs = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { include: { category: true } } } },
        createdBy: true,
      },
    });
    return dbPOs.map(mapPrismaPOToAppPO);
  } catch (error) {
    console.error('Failed to fetch purchase orders:', error);
    throw new Error('Could not fetch purchase orders.');
  }
}

export async function fetchPurchaseOrderById(id: string): Promise<AppPurchaseOrder | null> {
  try {
    const dbPO = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { category: true } } } },
        createdBy: true,
      },
    });
    if (!dbPO) return null;
    return mapPrismaPOToAppPO(dbPO);
  } catch (error) {
    console.error(`Failed to fetch purchase order ${id}:`, error);
    throw new Error('Could not fetch purchase order.');
  }
}

export async function createPurchaseOrder(data: PurchaseOrderFormValues): Promise<AppPurchaseOrder> {
  // const session = await getSession(); // Removed
  // if (!session?.user?.id) { // Removed
  //   throw new Error("User not authenticated or session invalid.");
  // }
  // const createdById = session.user.id; // Removed
  const createdByIdForDbOperations: string | undefined = undefined; // Placeholder

  if (!createdByIdForDbOperations) {
      console.warn("Creating Purchase Order without a user context. 'createdById' will be undefined.");
      // Depending on schema, this might fail if createdById is mandatory.
  }

  try {
    const { items, poNumber, supplierName, orderDate, expectedDeliveryDate, status, discountAmount, shippingCost, taxes, notes } = data;

    const subtotal = items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0);
    const finalDiscount = discountAmount ? Number(discountAmount) : 0;
    const finalShipping = shippingCost ? Number(shippingCost) : 0;
    const finalTaxes = taxes ? Number(taxes) : 0;
    const totalAmount = subtotal - finalDiscount + finalShipping + finalTaxes;

    const newDbPO = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierName,
        orderDate,
        expectedDeliveryDate,
        status: status || 'Draft',
        discountAmount: finalDiscount,
        shippingCost: finalShipping,
        taxes: finalTaxes,
        totalAmount,
        notes,
        createdById: createdByIdForDbOperations, // May be undefined
        items: {
          create: items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantityOrdered: item.quantityOrdered,
            unitCost: item.unitCost,
            totalCost: item.quantityOrdered * item.unitCost,
            quantityReceived: item.quantityReceived ?? null,
          })),
        },
      },
      include: { items: { include: {product: {include: {category: true}}} }, createdBy: true },
    });
    revalidatePath('/purchasing');
    revalidatePath(`/purchasing/${newDbPO.id}`);
    return mapPrismaPOToAppPO(newDbPO);
  } catch (error) {
    console.error('Failed to create purchase order:', error);
    throw new Error('Could not create purchase order.');
  }
}

export async function updatePurchaseOrder(id: string, data: PurchaseOrderFormValues): Promise<AppPurchaseOrder> {
  try {
    const { items, poNumber, supplierName, orderDate, expectedDeliveryDate, status, discountAmount, shippingCost, taxes, notes } = data;

    const subtotal = items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0);
    const finalDiscount = discountAmount ? Number(discountAmount) : 0;
    const finalShipping = shippingCost ? Number(shippingCost) : 0;
    const finalTaxes = taxes ? Number(taxes) : 0;
    const totalAmount = subtotal - finalDiscount + finalShipping + finalTaxes;

    const updatedDbPO = await prisma.$transaction(async (tx) => {
        await tx.purchaseOrderItem.deleteMany({
            where: { purchaseOrderId: id },
        });

        const newItemsData = items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantityOrdered: item.quantityOrdered,
            unitCost: item.unitCost,
            totalCost: item.quantityOrdered * item.unitCost,
            quantityReceived: item.quantityReceived ?? null,
        }));

        const po = await tx.purchaseOrder.update({
            where: { id },
            data: {
                poNumber,
                supplierName,
                orderDate,
                expectedDeliveryDate,
                status: status as PurchaseOrderStatus,
                discountAmount: finalDiscount,
                shippingCost: finalShipping,
                taxes: finalTaxes,
                totalAmount,
                notes,
                items: {
                    create: newItemsData
                }
            },
            include: { items: { include: {product: {include: {category: true}}} }, createdBy: true },
        });
        return po;
    });

    revalidatePath('/purchasing');
    revalidatePath(`/purchasing/${id}`);
    revalidatePath(`/purchasing/${id}/edit`);
    return mapPrismaPOToAppPO(updatedDbPO);
  } catch (error) {
    console.error(`Failed to update purchase order ${id}:`, error);
    throw new Error('Could not update purchase order.');
  }
}

export async function deletePurchaseOrderById(id: string): Promise<void> {
  try {
    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
    await prisma.purchaseOrder.delete({
      where: { id },
    });
    revalidatePath('/purchasing');
  } catch (error) {
    console.error(`Failed to delete purchase order ${id}:`, error);
    throw new Error('Could not delete purchase order.');
  }
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus, itemsToReceive?: AppPurchaseOrderItem[]): Promise<AppPurchaseOrder> {
  // const session = await getSession(); // Removed
  // const userIdForMovement = session?.user?.id; // Removed
  const userIdForMovement: string | undefined = undefined; // Placeholder

  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: {id},
      include: { items: true, createdBy: true}
    });

    if (!po) {
      throw new Error(`Purchase Order with ID ${id} not found.`);
    }

    const updatedPoData = await tx.purchaseOrder.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: {include: {category: true}} } }, createdBy: true },
    });

    if (status === 'Received' && itemsToReceive) {
      for (const item of itemsToReceive) {
        if (item.id) {
          await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: { quantityReceived: item.quantityOrdered }
          });

          await increaseProductStockAction(
            item.productId,
            item.quantityOrdered,
            'PURCHASE_RECEIPT',
            `Received from PO #${po.poNumber}`,
            po.id,
            userIdForMovement // May be undefined
          );
        } else {
          console.warn(`Item ${item.productName} is missing an ID, cannot update quantityReceived or stock.`);
        }
      }
    }

    revalidatePath('/purchasing');
    revalidatePath(`/purchasing/${id}`);
    if (status === 'Received' && itemsToReceive) {
        itemsToReceive.forEach(item => {
            revalidatePath(`/inventory/${item.productId}`);
            revalidatePath(`/inventory/${item.productId}/history`);
        });
        revalidatePath('/inventory');
    }

    return mapPrismaPOToAppPO(updatedPoData);
  }).catch(error => {
      console.error(`Failed to update status for PO ${id}:`, error);
      throw new Error('Could not update PO status.');
  });
}
