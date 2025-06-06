
'use server';

import { prisma } from '@/lib/prisma';
import type { PurchaseOrder as AppPurchaseOrder, PurchaseOrderItem as AppPurchaseOrderItem, PurchaseOrderStatus, StockMovementTypeEnum } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import type { PurchaseOrderFormValues } from './create/page'; 
import { increaseProductStockAction } from '@/app/inventory/actions'; // Import for stock updates

const mapPrismaPOToAppPO = (dbPO: any): AppPurchaseOrder => {
  return {
    ...dbPO,
    orderDate: dbPO.orderDate.toISOString(),
    expectedDeliveryDate: dbPO.expectedDeliveryDate?.toISOString() || null,
    status: dbPO.status as PurchaseOrderStatus,
    createdAt: dbPO.createdAt.toISOString(),
    updatedAt: dbPO.updatedAt.toISOString(),
    items: dbPO.items.map((item: any) => ({
      ...item,
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
        items: { include: { product: true } }, 
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
        createdById,
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
            quantityReceived: item.quantityReceived ?? null, // Use value from form
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
    // Also delete related POItems if not handled by onDelete: Cascade
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
  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: {id},
      include: { items: true, createdBy: true}
    });

    if (!po) {
      throw new Error(`Purchase Order with ID ${id} not found.`);
    }

    const updatedPo = await tx.purchaseOrder.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } }, createdBy: true },
    });

    if (status === 'Received' && itemsToReceive) {
      for (const item of itemsToReceive) {
        if (item.id) { // Ensure item.id is valid
          // Update PurchaseOrderItem quantityReceived
          await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: { quantityReceived: item.quantityOrdered } // Assuming full quantity received
          });
          
          // Increase product stock and log movement
          await increaseProductStockAction(
            item.productId,
            item.quantityOrdered, // Quantity to increase
            'PURCHASE_RECEIPT', // StockMovementTypeEnum.PURCHASE_RECEIPT
            `Received from PO #${po.poNumber}`,
            po.id,
            po.createdById // User who created the PO, or a dedicated receiving user if applicable
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

    return mapPrismaPOToAppPO(updatedPo);
  }).catch(error => {
      console.error(`Failed to update status for PO ${id}:`, error);
      throw new Error('Could not update PO status.');
  });
}
