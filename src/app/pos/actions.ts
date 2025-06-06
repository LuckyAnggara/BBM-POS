
'use server';

import { prisma } from '@/lib/prisma';
import type { Customer, Sale, CartItem, SaleDataForCreation, Product, User } from '@/lib/types'; // Removed StockMovementTypeEnum as it's not directly used here, will use string 'SALE'
import { StockMovementTypeEnum } from '@/lib/types'; // Explicitly import for use
import { revalidatePath } from 'next/cache';
// Removed: import { decreaseProductStockAction } from '@/app/inventory/actions';
import { getSession } from '@/lib/auth-utils';

const mapPrismaCustomerToAppCustomer = (dbCustomer: any): Customer | null => {
  if (!dbCustomer) return null;
  return {
    ...dbCustomer,
    createdAt: dbCustomer.createdAt.toISOString(),
    updatedAt: dbCustomer.updatedAt.toISOString(),
  };
};

const mapPrismaUserToAppUser = (prismaUser: any): User | undefined => {
  if (!prismaUser) return undefined;
  return {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    role: prismaUser.role,
    avatarUrl: prismaUser.avatarUrl ?? undefined,
    isActive: prismaUser.isActive,
    lastLogin: prismaUser.lastLogin?.toISOString() ?? null,
    createdAt: prismaUser.createdAt.toISOString(),
    updatedAt: prismaUser.updatedAt.toISOString(),
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
        costPriceAtSale: item.costPriceAtSale ? item.costPriceAtSale.toNumber() : null,
        product: item.product ? mapPrismaProductToAppProductLocal(item.product) : undefined,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      customer: mapPrismaCustomerToAppCustomer(dbSale.customer),
      user: mapPrismaUserToAppUser(dbSale.user),
    };
  };

export async function findOrCreateCustomer(
  name: string,
  email?: string,
  phone?: string
): Promise<Customer> {
  try {
    if (!name.trim()) {
        const guestName = "Guest Customer";
        let customer = await prisma.customer.findFirst({
            where: { name: guestName, email: null, phone: null },
        });
        if (!customer) {
            customer = await prisma.customer.create({
            data: { name: guestName },
            });
        }
        const mappedCustomer = mapPrismaCustomerToAppCustomer(customer);
        if (!mappedCustomer) throw new Error("Failed to map guest customer.");
        return mappedCustomer;
    }

    let customer;
    if (email) {
      customer = await prisma.customer.findUnique({
        where: { email },
      });
    }

    if (!customer && name) {
      // Try to find by name if not found by email
      const customersByName = await prisma.customer.findMany({
        where: { name },
      });
      // If multiple customers have the same name, this might need more specific logic
      // For now, taking the first one or allowing creation if none perfectly match.
      if (customersByName.length > 0) {
        customer = customersByName[0]; // Or implement logic to select/confirm
      }
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
        },
      });
    }
    const mappedCustomer = mapPrismaCustomerToAppCustomer(customer);
    if (!mappedCustomer) throw new Error("Failed to map customer.");
    return mappedCustomer;
  } catch (error) {
    console.error('Failed to find or create customer:', error);
    throw new Error('Could not find or create customer.');
  }
}

function generateSaleNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase(); // Shortened for brevity
  return `SL-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`;
}

export async function recordSale(
  saleData: Omit<SaleDataForCreation, 'userId'>,
): Promise<Sale> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("User not authenticated or session invalid.");
  }
  const userId = session.user.id;

  return await prisma.$transaction(async (tx) => {
    const {
        cartItems, customerId,
        subtotal, discountAmount = 0, taxPercent = 0, shippingCost = 0,
        customerName, paymentMethod, status = "Completed"
    } = saleData;

    const productIds = cartItems.map(item => item.productId);
    const productsInDb = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, costPrice: true, name: true, quantity: true },
    });
    const productMap = new Map(productsInDb.map(p => [p.id, p]));

    for (const item of cartItems) {
      const productInfo = productMap.get(item.productId);
      if (!productInfo || productInfo.quantity < item.quantity) {
        throw new Error(`Not enough stock for ${productInfo?.name || item.name}. Available: ${productInfo?.quantity || 0}`);
      }
    }

    const saleItemsData = cartItems.map((item: CartItem) => ({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
      costPriceAtSale: productMap.get(item.productId)?.costPrice ?? item.costPrice ?? null,
    }));

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmountValue = taxableAmount * (taxPercent / 100);
    const grandTotalValue = Math.max(0, subtotal - discountAmount + taxAmountValue + shippingCost);
    const saleNumber = generateSaleNumber();

    const createdSale = await tx.sale.create({
      data: {
        saleNumber,
        saleDate: new Date(),
        subtotal,
        discountAmount,
        taxPercent,
        taxAmount: taxAmountValue,
        shippingCost,
        grandTotal: grandTotalValue,
        customerName: customerName,
        paymentMethod,
        status,
        ...(customerId && { customerId: customerId }),
        userId,
        items: {
          create: saleItemsData,
        },
      },
      include: {
          items: { include: { product: {include: {category: true} } } },
          customer: true,
          user: true
        },
    });

    // Decrease stock and log movement directly within this transaction
    for (const item of createdSale.items) {
      const product = productMap.get(item.productId); // Use already fetched product info
      if (!product) {
        // This should not happen if stock check passed, but as a safeguard
        throw new Error(`Product with ID ${item.productId} not found during stock update for sale ${createdSale.saleNumber}.`);
      }

      const quantityBefore = product.quantity;
      const quantityAfter = quantityBefore - item.quantity;

      // The initial stock check should prevent quantityAfter < 0
      // If it still happens, it indicates a race condition or a flaw in initial check
      if (quantityAfter < 0) {
        throw new Error(`Stock for ${item.productName} would go below zero. Transaction rolled back.`);
      }
      
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: quantityAfter },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: StockMovementTypeEnum.SALE, // Use enum
          quantityChange: -item.quantity,
          quantityBefore,
          quantityAfter,
          reason: `Sale #${createdSale.saleNumber}`,
          referenceId: createdSale.id,
          userId, // userId from session
        },
      });
    }

    revalidatePath('/pos');
    revalidatePath('/sales/history');
    revalidatePath('/inventory'); // General inventory revalidation
    createdSale.items.forEach(item => { // More specific revalidations
        revalidatePath(`/inventory/${item.productId}`);
        revalidatePath(`/inventory/${item.productId}/history`);
        if (item.product?.category?.name) {
            revalidatePath(`/inventory?category=${encodeURIComponent(item.product.category.name)}`);
        }
    });
    revalidatePath('/admin/products'); // For admin product list view

    return mapPrismaSaleToAppSale(createdSale);
  }).catch(error => {
    console.error('Failed to record sale transaction:', error);
    if (error instanceof Error && error.message.startsWith("Not enough stock for")) {
        throw error;
    }
    if (error instanceof Error && (error as any).code === 'P2002' && (error as any).meta?.target?.includes('saleNumber')) {
         console.error('Sale number collision, this should be very rare.');
         throw new Error('Failed to generate a unique sale number. Please try again.');
    }
    throw new Error('Could not record sale.');
  });
}

    