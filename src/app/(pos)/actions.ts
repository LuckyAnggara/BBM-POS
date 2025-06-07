
'use server';

import { prisma } from '@/lib/prisma';
import type { Customer, Sale, CartItem, SaleDataForCreation, Product, User, PosSession, CashTransaction, CashTransactionType } from '@/lib/types';
import { StockMovementTypeEnum, CashTransactionTypeEnum, PosSessionStatusEnum } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getUserSession, type UserSessionData } from '@/lib/user-session'; 
import { Decimal } from '@prisma/client/runtime/library';
import type { PosSession as PrismaPosSession } from '@prisma/client';


const mapPrismaUserToAppUser = (prismaUser: any): User | undefined => {
  if (!prismaUser) return undefined;
  return {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    role: prismaUser.role,
    avatarUrl: prismaUser.image ?? undefined, 
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

const mapPrismaCashTransactionToApp = (dbCashTransaction: any): CashTransaction => {
    return {
        ...dbCashTransaction,
        amount: dbCashTransaction.amount.toNumber(),
        createdAt: dbCashTransaction.createdAt.toISOString(),
        user: dbCashTransaction.user ? mapPrismaUserToAppUser(dbCashTransaction.user) : undefined,
    };
};

const mapPrismaPosSessionToApp = (dbPosSession: any): PosSession => {
  const expectedCash = dbPosSession.expectedCashInDrawer.toNumber();
  const countedCashVal = dbPosSession.countedCash?.toNumber() ?? null;
  // Calculate cashDifference only if countedCash is available
  const cashDifferenceVal = countedCashVal !== null && dbPosSession.status === PosSessionStatusEnum.CLOSED
    ? countedCashVal - expectedCash 
    : null;

  return {
    id: dbPosSession.id,
    userId: dbPosSession.userId,
    startTime: dbPosSession.startTime.toISOString(),
    endTime: dbPosSession.endTime?.toISOString() || null,
    startingCash: dbPosSession.startingCash.toNumber(),
    countedCash: countedCashVal,
    expectedCashInDrawer: expectedCash,
    cashDifference: cashDifferenceVal,
    totalSalesAmount: dbPosSession.totalSalesAmount.toNumber(),
    totalRefundsAmount: dbPosSession.totalRefundsAmount.toNumber(),
    status: dbPosSession.status as PosSessionStatusEnum,
    createdAt: dbPosSession.createdAt.toISOString(),
    updatedAt: dbPosSession.updatedAt.toISOString(),
    user: dbPosSession.user ? mapPrismaUserToAppUser(dbPosSession.user) : undefined,
    cashTransactions: dbPosSession.cashTransactions?.map(mapPrismaCashTransactionToApp) || [],
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
      cashTransactionId: dbSale.cashTransactionId,
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
      user: dbSale.user ? mapPrismaUserToAppUser(dbSale.user) : undefined,
      cashTransaction: dbSale.cashTransaction ? mapPrismaCashTransactionToApp(dbSale.cashTransaction) : undefined,
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
      const customersByName = await prisma.customer.findMany({
        where: { name },
      });
      if (customersByName.length > 0) {
        customer = customersByName[0]; 
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
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SL-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`;
}

export async function recordSale(
  saleData: Omit<SaleDataForCreation, 'userId'>,
): Promise<Sale> {
  const session = await getUserSession();
  if (!session?.userId) {
    throw new Error("User not authenticated. Please log in to record a sale.");
  }
  const userIdForDbOperations = session.userId;

  return await prisma.$transaction(async (tx) => {
    const {
        cartItems, customerId,
        subtotal, discountAmount = 0, taxPercent = 0, shippingCost = 0,
        customerName, paymentMethod, status = "Completed"
    } = saleData;

    const productIds = cartItems.map(item => item.productId);
    const productsInDb = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, costPrice: true, name: true, quantity: true, category: true },
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

    let activePosSession: PrismaPosSession | null = null;
    if (paymentMethod === 'Cash') {
        activePosSession = await tx.posSession.findFirst({
            where: { userId: userIdForDbOperations, status: PosSessionStatusEnum.OPEN }
        });
        if (!activePosSession) {
            console.warn(`No active POS session for user ${userIdForDbOperations} during cash sale ${saleNumber}. Sale recorded without cash drawer update.`);
        }
    }


    let cashTransactionRecordId: string | undefined = undefined;
    if (paymentMethod === 'Cash' && activePosSession) {
        const cashTx = await tx.cashTransaction.create({
            data: {
                posSessionId: activePosSession.id,
                userId: userIdForDbOperations,
                type: CashTransactionTypeEnum.SALE_CASH,
                amount: grandTotalValue,
                description: `Sale #${saleNumber}`,
            }
        });
        cashTransactionRecordId = cashTx.id;

        await tx.posSession.update({
            where: { id: activePosSession.id },
            data: {
                expectedCashInDrawer: { increment: grandTotalValue },
                totalSalesAmount: { increment: grandTotalValue }
            }
        });
    }


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
        customerName: customerName || 'Guest Customer',
        paymentMethod,
        status,
        ...(customerId && { customerId: customerId }),
        userId: userIdForDbOperations,
        cashTransactionId: cashTransactionRecordId,
        items: {
          create: saleItemsData,
        },
      },
      include: {
          items: { include: { product: {include: {category: true} } } },
          customer: true,
          user: true,
          cashTransaction: true,
        },
    });

    for (const item of createdSale.items) {
      const product = productMap.get(item.productId); 
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found during stock update for sale ${createdSale.saleNumber}.`);
      }

      const quantityBefore = product.quantity;
      const quantityAfter = quantityBefore - item.quantity;

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
          type: StockMovementTypeEnum.SALE,
          quantityChange: -item.quantity,
          quantityBefore,
          quantityAfter,
          reason: `Sale #${createdSale.saleNumber}`,
          referenceId: createdSale.id,
          userId: userIdForDbOperations,
        },
      });
    }

    revalidatePath('/(pos)/pos');
    revalidatePath('/(app)/sales/history');
    revalidatePath('/(app)/inventory'); 
    createdSale.items.forEach(item => { 
        if (item.product?.id) revalidatePath(`/(app)/inventory/${item.product.id}`);
        if (item.product?.id) revalidatePath(`/(app)/inventory/${item.product.id}/history`);
        if (item.product?.category?.name) {
            revalidatePath(`/(app)/inventory?category=${encodeURIComponent(item.product.category.name)}`);
        }
    });
    revalidatePath('/(app)/admin/products');
    if (activePosSession) {
        revalidatePath('/(pos)/pos'); 
        revalidatePath('/reports/shift-history');
    }

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


export async function startPosSession(startingCash: number): Promise<PosSession> {
  const session = await getUserSession();
  if (!session?.userId) {
    throw new Error("User not authenticated. Please log in to start a POS session.");
  }
  const userIdForDbOperations = session.userId;


  const existingOpenSession = await prisma.posSession.findFirst({
    where: {
      userId: userIdForDbOperations,
      status: PosSessionStatusEnum.OPEN,
    },
  });

  if (existingOpenSession) {
    throw new Error("You already have an active POS session. Please close it before starting a new one.");
  }
  
  if (startingCash < 0) {
    throw new Error("Starting cash cannot be negative.");
  }

  return await prisma.$transaction(async (tx) => {
    const newPosSession = await tx.posSession.create({
      data: {
        userId: userIdForDbOperations,
        startTime: new Date(),
        startingCash: startingCash,
        expectedCashInDrawer: startingCash, // Initial expected is starting cash
        status: PosSessionStatusEnum.OPEN,
        totalSalesAmount: 0, // Initialize aggregates
        totalRefundsAmount: 0,
      },
      include: { user: true, cashTransactions: true } 
    });

    // Log starting cash as a transaction
    await tx.cashTransaction.create({
      data: {
        posSessionId: newPosSession.id,
        userId: userIdForDbOperations,
        type: CashTransactionTypeEnum.STARTING_CASH,
        amount: startingCash,
        description: "Initial cash for session",
      },
    });

    revalidatePath('/(pos)/pos');
    revalidatePath('/reports/shift-history');
    return mapPrismaPosSessionToApp(newPosSession);
  });
}


export async function getActivePosSession(): Promise<PosSession | null> {
  const session = await getUserSession();
  if (!session?.userId) {
    console.warn("No authenticated user to fetch active POS session with new auth.");
    return null;
  }
  const userIdForDbOperations = session.userId;

  const activeDbSession = await prisma.posSession.findFirst({
    where: {
      userId: userIdForDbOperations,
      status: PosSessionStatusEnum.OPEN,
    },
    include: { user: true, cashTransactions: { orderBy: { createdAt: 'asc' } } }
  });

  if (!activeDbSession) {
    return null;
  }
  return mapPrismaPosSessionToApp(activeDbSession);
}

export async function endPosSession(sessionId: string, countedCashFloat: number): Promise<PosSession> {
  const session = await getUserSession();
  if (!session?.userId) {
    throw new Error("User not authenticated. Please log in to end a POS session.");
  }
  const userIdForDbOperations = session.userId;
  const countedCashDecimal = new Decimal(countedCashFloat);

  return await prisma.$transaction(async (tx) => {
    const activeDbSession = await tx.posSession.findUnique({
      where: { id: sessionId, userId: userIdForDbOperations, status: PosSessionStatusEnum.OPEN },
    });

    if (!activeDbSession) {
      throw new Error("Active POS session not found for this user or it's already closed.");
    }

    // Update the session: set end time, status to CLOSED, and record counted cash
    const updatedDbSession = await tx.posSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        status: PosSessionStatusEnum.CLOSED,
        countedCash: countedCashDecimal,
      },
      include: { user: true, cashTransactions: { orderBy: { createdAt: 'asc' } } } // Re-include for mapping
    });

    // Create a cash transaction for the final cash counted (interpreted as amount removed or reconciled)
    // The description can hold more context.
    await tx.cashTransaction.create({
      data: {
        posSessionId: sessionId,
        userId: userIdForDbOperations,
        type: CashTransactionTypeEnum.PAY_OUT, // Using PAY_OUT to signify cash reconciled/removed
        amount: countedCashDecimal, 
        description: `End of shift cash count. Expected: ${activeDbSession.expectedCashInDrawer.toFixed(2)}, Counted: ${countedCashDecimal.toFixed(2)}.`,
      }
    });
    
    // Important: expectedCashInDrawer on the PosSession is what was expected BEFORE this final count.
    // The difference is calculated dynamically for reports.
    // If the system needs to track a running balance that gets zeroed out, 
    // then expectedCashInDrawer would be decremented here by countedCashDecimal.
    // For reporting, current approach is fine.

    revalidatePath('/(pos)/pos');
    revalidatePath('/reports/shift-history');
    
    return mapPrismaPosSessionToApp(updatedDbSession); // mapPrismaPosSessionToApp will calculate cashDifference
  });
}
