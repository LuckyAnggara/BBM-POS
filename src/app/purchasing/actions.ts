
'use server';

import { prisma } from '@/lib/prisma';
import type { PurchaseOrder as AppPurchaseOrder, PurchaseOrderItem as AppPurchaseOrderItem, PurchaseOrderStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { PurchaseOrderFormValues, PurchaseOrderItemFormValues } from './create/page'; // Assuming types are similar for edit

// Helper to map Prisma PO to App PO
const mapPrismaPOToAppPO = (dbPO: any): AppPurchaseOrder => {
  return {
    ...dbPO,
    orderDate: dbPO.orderDate.toISOString(),
    expectedDeliveryDate: dbPO.expectedDeliveryDate?.toISOString() || null,
    createdAt: dbPO.createdAt.toISOString(),
    updatedAt: dbPO.updatedAt.toISOString(),
    items: dbPO.items.map((item: any) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    // createdBy is already an object if included, or just createdById if not
  };
};


export async function fetchPurchaseOrders(): Promise<AppPurchaseOrder[]> {
  try {
    const dbPOs = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } }, // Include product details in items
        createdBy: true, // Include user who created it
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
        items: { include: { product: true } },
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

export async function createPurchaseOrder(data: PurchaseOrderFormValues, createdById: string): Promise<AppPurchaseOrder> {
  try {
    const { items, poNumber, supplierName, orderDate, expectedDeliveryDate, discountAmount, shippingCost, taxes, notes } = data;

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
        status: 'Draft', // Default status
        discountAmount: finalDiscount,
        shippingCost: finalShipping,
        taxes: finalTaxes,
        totalAmount,
        notes,
        createdById,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            productName: item.productName, // Assuming productName is passed in form data
            quantityOrdered: item.quantityOrdered,
            unitCost: item.unitCost,
            totalCost: item.quantityOrdered * item.unitCost,
          })),
        },
      },
      include: { items: { include: {product: true} }, createdBy: true },
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
    
    // Transaction to update PO and its items
    const updatedDbPO = await prisma.$transaction(async (tx) => {
        // Delete existing items for this PO
        await tx.purchaseOrderItem.deleteMany({
            where: { purchaseOrderId: id },
        });

        // Create new items
        const newItemsData = items.map(item => ({
            purchaseOrderId: id, // This needs to be set if creating items separately
            productId: item.productId,
            productName: item.productName,
            quantityOrdered: item.quantityOrdered,
            unitCost: item.unitCost,
            totalCost: item.quantityOrdered * item.unitCost,
            quantityReceived: data.items.find(i => i.productId === item.productId)?.quantityReceived || null
        }));
        
        // Update the PurchaseOrder
        const po = await tx.purchaseOrder.update({
            where: { id },
            data: {
                poNumber,
                supplierName,
                orderDate,
                expectedDeliveryDate,
                status, // Status from form
                discountAmount: finalDiscount,
                shippingCost: finalShipping,
                taxes: finalTaxes,
                totalAmount,
                notes,
                items: {
                    create: newItemsData
                }
                // createdById is not changed during update
            },
            include: { items: { include: {product: true} }, createdBy: true },
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
    // Prisma onDelete: Cascade will handle PurchaseOrderItem deletion
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
  try {
    const updateData: any = { status };
    if (status === 'Received' && itemsToReceive) {
        // This part is tricky if we also update item's quantityReceived here.
        // For now, just update PO status. Stock update is client-side.
        // Or, we can update quantityReceived on items if needed.
        await prisma.purchaseOrderItem.updateMany({
            where: { purchaseOrderId: id },
            data: { quantityReceived: { increment: 0 } } // Placeholder, actual logic might be per item
        });
        // This requires a more complex update if items can be partially received.
        // For a simple "Mark all as Received":
        for (const item of itemsToReceive) {
            await prisma.purchaseOrderItem.update({
                where: { id: item.id }, // Assuming item has an id
                data: { quantityReceived: item.quantityOrdered }
            });
        }

    }

    const updatedDbPO = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: { items: {include: {product: true}}, createdBy: true },
    });
    revalidatePath('/purchasing');
    revalidatePath(`/purchasing/${id}`);
    return mapPrismaPOToAppPO(updatedDbPO);
  } catch (error) {
    console.error(`Failed to update status for PO ${id}:`, error);
    throw new Error('Could not update PO status.');
  }
}

