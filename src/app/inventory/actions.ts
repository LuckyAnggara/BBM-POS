
'use server';

import { prisma } from '@/lib/prisma';
import type { Product } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Helper to convert Prisma Product to App Product (handling tags JSON)
const mapPrismaProductToAppProduct = (prismaProduct: any): Product => {
  return {
    ...prismaProduct,
    costPrice: prismaProduct.costPrice ?? undefined,
    supplier: prismaProduct.supplier ?? undefined,
    description: prismaProduct.description ?? undefined,
    imageUrl: prismaProduct.imageUrl ?? undefined,
    lowStockThreshold: prismaProduct.lowStockThreshold ?? undefined,
    tags: prismaProduct.tags ? JSON.parse(prismaProduct.tags as string) : [],
    createdAt: prismaProduct.createdAt.toISOString(),
    updatedAt: prismaProduct.updatedAt.toISOString(),
  };
};

export async function fetchAllProductsAction(): Promise<Product[]> {
  try {
    const dbProducts = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
    return dbProducts.map(mapPrismaProductToAppProduct);
  } catch (error) {
    console.error('Failed to fetch products action:', error);
    throw new Error('Could not fetch products.');
  }
}

export async function createProductAction(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  try {
    const { tags, ...restOfData } = productData;
    const newDbProduct = await prisma.product.create({
      data: {
        ...restOfData,
        tags: tags ? JSON.stringify(tags) : JSON.stringify([]),
      },
    });
    revalidatePath('/inventory');
    revalidatePath('/admin/products');
    return mapPrismaProductToAppProduct(newDbProduct);
  } catch (error) {
    console.error('Failed to create product action:', error);
    throw new Error('Could not create product.');
  }
}

export async function updateProductAction(productId: string, updatedProductData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
  try {
    const { tags, ...restOfData } = updatedProductData;
    const dataToUpdate: any = { ...restOfData };
    if (tags !== undefined) {
      dataToUpdate.tags = tags ? JSON.stringify(tags) : JSON.stringify([]);
    }

    const updatedDbProduct = await prisma.product.update({
      where: { id: productId },
      data: dataToUpdate,
    });
    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);
    revalidatePath(`/inventory/${productId}/edit`);
    revalidatePath('/admin/products');
    return mapPrismaProductToAppProduct(updatedDbProduct);
  } catch (error) {
    console.error('Failed to update product action:', error);
    throw new Error('Could not update product.');
  }
}

export async function deleteProductAction(productId: string): Promise<void> {
  try {
    await prisma.product.delete({
      where: { id: productId },
    });
    revalidatePath('/inventory');
    revalidatePath('/admin/products');
  } catch (error) {
    console.error('Failed to delete product action:', error);
    throw new Error('Could not delete product.');
  }
}

export async function decreaseProductStockAction(productId: string, quantityToDecrease: number): Promise<Product> {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found for stock decrease.");

    const newQuantity = Math.max(0, product.quantity - quantityToDecrease);
    
    const updatedDbProduct = await prisma.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    });
    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);
    revalidatePath('/pos'); // Revalidate POS page as stock changes
    return mapPrismaProductToAppProduct(updatedDbProduct);
  } catch (error) {
    console.error('Failed to decrease product stock action:', error);
    throw new Error('Could not decrease product stock.');
  }
}

export async function increaseProductStockAction(productId: string, quantityToIncrease: number): Promise<Product> {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found for stock increase.");
    
    const newQuantity = product.quantity + quantityToIncrease;

    const updatedDbProduct = await prisma.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    });
    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);
    revalidatePath('/purchasing'); // Revalidate purchasing page as stock changes
    return mapPrismaProductToAppProduct(updatedDbProduct);
  } catch (error) {
    console.error('Failed to increase product stock action:', error);
    throw new Error('Could not increase product stock.');
  }
}
