
'use server';

import { prisma } from '@/lib/prisma';
import type { Customer, Sale, CartItem, SaleDataForCreation, Product, User, StockMovementTypeEnum, Category } from '@/lib/types'; 
import { revalidatePath } from 'next/cache';
import { decreaseProductStockAction } from '@/app/inventory/actions';

const mapPrismaCustomerToAppCustomer = (dbCustomer: any): Customer | null => {
  if (!dbCustomer) return null;
  return {
    ...dbCustomer, // Spreads all fields including id, name, email, phone
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

// Local product mapper to avoid import issues and ensure correct Decimal conversion
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
      // Convert Decimal fields to numbers
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
        // Convert Decimal fields to numbers
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
        if (!mappedCustomer) throw new Error("Failed to map guest customer."); // Should not happen
        return mappedCustomer;
    }

    let customer;
    if (email) {
      customer = await prisma.customer.findUnique({
        where: { email },
      });
    }

    if (!customer && name) { 
      customer = await prisma.customer.findFirst({
        where: { name }, 
      });
    }
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          email: email || null, 
          phone: phone || null, // ensure phone is string or null
        },
      });
    }
    const mappedCustomer = mapPrismaCustomerToAppCustomer(customer);
    if (!mappedCustomer) throw new Error("Failed to map customer."); // Should not happen
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
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SALE-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`;
}

export async function recordSale(
  saleData: SaleDataForCreation,
): Promise<Sale> {
  return await prisma.$transaction(async (tx) => {
    const { 
        cartItems, customerId, userId, 
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

    for (const item of createdSale.items) {
      await decreaseProductStockAction(
        item.productId, 
        item.quantity,
        'SALE', 
        `Sale #${createdSale.saleNumber}`,
        createdSale.id,
        userId || undefined 
      );
    }
    
    revalidatePath('/pos');
    revalidatePath('/sales/history'); 
    cartItems.forEach(item => {
        revalidatePath(`/inventory/${item.productId}`);
        revalidatePath(`/inventory/${item.productId}/history`);
    });
    revalidatePath('/inventory');

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

