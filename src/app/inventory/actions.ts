
'use server';

import { prisma } from '@/lib/prisma';
import type { Product, Category, StockMovementType } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const mapPrismaProductToAppProduct = (prismaProduct: any): Product => {
  return {
    ...prismaProduct,
    costPrice: prismaProduct.costPrice ?? undefined,
    supplier: prismaProduct.supplier ?? undefined,
    description: prismaProduct.description ?? undefined,
    imageUrl: prismaProduct.imageUrl ?? undefined,
    lowStockThreshold: prismaProduct.lowStockThreshold ?? undefined,
    tags: prismaProduct.tags ? JSON.parse(prismaProduct.tags as string) : [],
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

const mapPrismaCategoryToAppCategory = (dbCategory: any): Category => {
  return {
    ...dbCategory,
    createdAt: dbCategory.createdAt.toISOString(),
    updatedAt: dbCategory.updatedAt.toISOString(),
  };
};

export async function fetchAllProductsAction(includeCategory: boolean = true): Promise<Product[]> {
  const dbProducts = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: 'asc' },
  });
  return dbProducts.map(mapPrismaProductToAppProduct);
}

export async function createProductAction(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>): Promise<Product> {
  try {
    const { tags, categoryId, quantity, ...restOfData } = productData;
    const newDbProduct = await prisma.product.create({
      data: {
        ...restOfData,
        quantity,
        tags: tags ? JSON.stringify(tags) : JSON.stringify([]),
        ...(categoryId && { categoryId: categoryId }),
      },
      include: { category: true },
    });

    // Log initial stock movement
    if (quantity > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: newDbProduct.id,
          type: 'INITIAL_STOCK',
          quantityChange: quantity,
          quantityBefore: 0,
          quantityAfter: quantity,
          reason: 'Initial stock for new product',
        }
      });
    }

    revalidatePath('/inventory');
    revalidatePath('/admin/products');
    revalidatePath('/pos'); 
    if (categoryId) {
        const category = await prisma.category.findUnique({ where: {id: categoryId}});
        if (category) revalidatePath(`/inventory?category=${encodeURIComponent(category.name)}`);
    }
    return mapPrismaProductToAppProduct(newDbProduct);
  } catch (error) {
    console.error('Failed to create product action:', error);
    throw new Error('Could not create product.');
  }
}

export async function updateProductAction(productId: string, updatedProductData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>>): Promise<Product> {
  try {
    const { tags, categoryId, ...restOfData } = updatedProductData;
    const dataToUpdate: any = { ...restOfData };
    if (tags !== undefined) {
      dataToUpdate.tags = tags ? JSON.stringify(tags) : JSON.stringify([]);
    }
    if (categoryId !== undefined) {
        dataToUpdate.categoryId = categoryId ? categoryId : null;
    }

    const updatedDbProduct = await prisma.product.update({
      where: { id: productId },
      data: dataToUpdate,
      include: { category: true },
    });

    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);
    revalidatePath(`/inventory/${productId}/edit`);
    revalidatePath('/admin/products');
    revalidatePath('/pos');
    if (updatedDbProduct.category) {
         revalidatePath(`/inventory?category=${encodeURIComponent(updatedDbProduct.category.name)}`);
    }
    return mapPrismaProductToAppProduct(updatedDbProduct);
  } catch (error) {
    console.error('Failed to update product action:', error);
    throw new Error('Could not update product.');
  }
}

export async function deleteProductAction(productId: string): Promise<void> {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId }, include: { category: true } });
    // Add cascading delete for stock movements related to this product or handle them as needed.
    // For now, assuming onDelete: Cascade is set or movements are kept for historical reasons.
    await prisma.stockMovement.deleteMany({ where: { productId }}); // If you want to delete movements
    await prisma.product.delete({
      where: { id: productId },
    });
    revalidatePath('/inventory');
    revalidatePath('/admin/products');
    revalidatePath('/pos');
    if (product?.category) {
        revalidatePath(`/inventory?category=${encodeURIComponent(product.category.name)}`);
    }
  } catch (error) {
    console.error('Failed to delete product action:', error);
    throw new Error('Could not delete product.');
  }
}

async function logStockMovement(
  productId: string,
  type: StockMovementType,
  quantityChange: number,
  reason?: string,
  referenceId?: string,
  userId?: string
): Promise<Product> {
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error(`Product with ID ${productId} not found for stock movement.`);

    const quantityBefore = product.quantity;
    const quantityAfter = quantityBefore + quantityChange;

    if (quantityAfter < 0) {
      throw new Error(`Stock quantity for ${product.name} cannot go below zero. Current: ${quantityBefore}, Change: ${quantityChange}`);
    }
    
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { quantity: quantityAfter },
      include: { category: true },
    });

    await tx.stockMovement.create({
      data: {
        productId,
        type,
        quantityChange,
        quantityBefore,
        quantityAfter,
        reason,
        referenceId,
        userId,
      },
    });
    return updatedProduct;
  });
}


export async function decreaseProductStockAction(
  productId: string, 
  quantityToDecrease: number,
  movementType: StockMovementType,
  reason?: string,
  referenceId?: string,
  userId?: string
): Promise<Product> {
  try {
    if (quantityToDecrease <= 0) throw new Error("Quantity to decrease must be positive.");
    const updatedDbProduct = await logStockMovement(productId, movementType, -quantityToDecrease, reason, referenceId, userId);
    
    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);
    revalidatePath('/pos'); 
    revalidatePath('/admin/products'); 
    revalidatePath(`/inventory/${productId}/history`);
    if (updatedDbProduct.category) {
        revalidatePath(`/inventory?category=${encodeURIComponent(updatedDbProduct.category.name)}`);
    }
    return mapPrismaProductToAppProduct(updatedDbProduct);
  } catch (error) {
    console.error('Failed to decrease product stock action:', error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('Could not decrease product stock.');
  }
}

export async function increaseProductStockAction(
  productId: string, 
  quantityToIncrease: number,
  movementType: StockMovementType,
  reason?: string,
  referenceId?: string,
  userId?: string
): Promise<Product> {
  try {
    if (quantityToIncrease <= 0) throw new Error("Quantity to increase must be positive.");
    const updatedDbProduct = await logStockMovement(productId, movementType, quantityToIncrease, reason, referenceId, userId);

    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);
    revalidatePath('/purchasing'); 
    revalidatePath('/admin/products');
    revalidatePath(`/inventory/${productId}/history`);
     if (updatedDbProduct.category) {
        revalidatePath(`/inventory?category=${encodeURIComponent(updatedDbProduct.category.name)}`);
    }
    return mapPrismaProductToAppProduct(updatedDbProduct);
  } catch (error) {
    console.error('Failed to increase product stock action:', error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('Could not increase product stock.');
  }
}

export async function fetchAllCategoriesAction(): Promise<Category[]> {
  try {
    const dbCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return dbCategories.map(mapPrismaCategoryToAppCategory);
  } catch (error) {
    console.error('Failed to fetch categories action:', error);
    throw new Error('Could not fetch categories.');
  }
}


// Action to fetch stock movements for a product
export async function fetchStockMovementsByProductId(productId: string): Promise<import('@/lib/types').StockMovement[]> {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { product: true, user: true } 
    });
    return movements.map(m => ({
      ...m,
      type: m.type as StockMovementType, // Ensure enum type
      createdAt: m.createdAt.toISOString(),
      product: m.product ? mapPrismaProductToAppProduct(m.product) : undefined,
      user: m.user ? {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.user.role,
        avatarUrl: m.user.avatarUrl,
        isActive: m.user.isActive,
        lastLogin: m.user.lastLogin?.toISOString(),
        createdAt: m.user.createdAt.toISOString(),
        updatedAt: m.user.updatedAt.toISOString(),
      } : undefined,
    }));
  } catch (error) {
    console.error(`Failed to fetch stock movements for product ${productId}:`, error);
    throw new Error('Could not fetch stock movements.');
  }
}

