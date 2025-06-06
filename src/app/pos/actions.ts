
'use server';

import { prisma } from '@/lib/prisma';
import type { Customer, Sale, SaleItem, CartItem, SaleDataForCreation } from '@/lib/types'; // Make sure SaleDataForCreation and SaleItemDataForCreation are defined in types.ts
import { revalidatePath } from 'next/cache';

// Helper to map Prisma Customer to App Customer
const mapPrismaCustomerToAppCustomer = (dbCustomer: any): Customer => {
  return {
    ...dbCustomer,
    createdAt: dbCustomer.createdAt.toISOString(),
    updatedAt: dbCustomer.updatedAt.toISOString(),
  };
};

// Helper to map Prisma Sale to App Sale
const mapPrismaSaleToAppSale = (dbSale: any): Sale => {
    return {
      ...dbSale,
      saleDate: dbSale.saleDate.toISOString(),
      createdAt: dbSale.createdAt.toISOString(),
      updatedAt: dbSale.updatedAt.toISOString(),
      items: dbSale.items.map((item: any) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      // Customer and User relations might be included or fetched separately as needed
      customer: dbSale.customer ? mapPrismaCustomerToAppCustomer(dbSale.customer) : null,
      // user: dbSale.user ? mapPrismaUserToAppUser(dbSale.user) : undefined, // Assuming mapPrismaUserToAppUser exists
    };
  };

export async function findOrCreateCustomer(
  name: string,
  email?: string,
  phone?: string
): Promise<Customer> {
  try {
    if (!name.trim()) {
        // Handle as guest or throw error if name is mandatory
        // For now, let's try to find a generic "Guest Customer" or create one if specific name is not provided.
        // This logic might need refinement based on business rules for guest checkouts.
        const guestName = "Guest Customer";
        let customer = await prisma.customer.findFirst({
            where: { name: guestName, email: null, phone: null }, // A more specific guest signature
        });
        if (!customer) {
            customer = await prisma.customer.create({
            data: { name: guestName },
            });
        }
        return mapPrismaCustomerToAppCustomer(customer);
    }


    // Try to find by email if provided and unique, otherwise by name.
    // This logic can be more sophisticated (e.g., fuzzy matching name, preferring email match).
    let customer;
    if (email) {
      customer = await prisma.customer.findUnique({
        where: { email },
      });
    }

    if (!customer) {
      customer = await prisma.customer.findFirst({
        where: { name }, // This could lead to duplicates if names aren't unique.
                         // Consider more robust matching or making email mandatory for non-guests.
      });
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          email: email || null, // Ensure email is explicitly null if not provided
          phone,
        },
      });
    }
    return mapPrismaCustomerToAppCustomer(customer);
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
  try {
    const { 
        cartItems, customerId, userId, 
        subtotal, discountAmount = 0, taxPercent = 0, shippingCost = 0, customerName 
    } = saleData;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmountValue = taxableAmount * (taxPercent / 100);
    const grandTotalValue = Math.max(0, subtotal - discountAmount + taxAmountValue + shippingCost);
    const saleNumber = generateSaleNumber();

    const createdSale = await prisma.sale.create({
      data: {
        saleNumber,
        saleDate: new Date(),
        subtotal,
        discountAmount,
        taxPercent,
        taxAmount: taxAmountValue,
        shippingCost,
        grandTotal: grandTotalValue,
        customerName: customerName, // Use the name from SaleDataForCreation
        ...(customerId && { customerId: customerId }), // Connect to customer if ID is provided
        userId,
        items: {
          create: cartItems.map((item: CartItem) => ({
            productId: item.productId,
            productName: item.name, // Denormalized name
            quantity: item.quantity,
            unitPrice: item.price, // Price at the time of sale
            totalPrice: item.price * item.quantity,
          })),
        },
      },
      include: { 
          items: { include: { product: true } }, 
          customer: true,
          user: true 
        },
    });

    revalidatePath('/pos'); // Potentially revalidate other paths like sales history later
    // Revalidate product paths if stock changes are tied here or done separately
    cartItems.forEach(item => {
        revalidatePath(`/inventory/${item.productId}`);
    });
    revalidatePath('/inventory');


    return mapPrismaSaleToAppSale(createdSale);
  } catch (error) {
    console.error('Failed to record sale:', error);
    // Consider more specific error handling or re-throwing
    if (error instanceof Error) {
        if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('saleNumber')) {
            // Highly unlikely due to timestamp and random suffix, but handle unique constraint violation for saleNumber
             console.error('Sale number collision, this should be very rare. Consider retrying or adjusting generation.', error);
             throw new Error('Failed to generate a unique sale number. Please try again.');
        }
    }
    throw new Error('Could not record sale.');
  }
}
