
'use server';

import { prisma } from '@/lib/prisma';
import type { Product, Category } from '@/lib/types'; // Added Category type
import { revalidatePath } from 'next/cache';

// Helper to convert Prisma Product to App Product (handling tags JSON and category)
const mapPrismaProductToAppProduct = (prismaProduct: any): Product => {
  return {
    ...prismaProduct,
    costPrice: prismaProduct.costPrice ?? undefined,
    supplier: prismaProduct.supplier ?? undefined,
    description: prismaProduct.description ?? undefined,
    imageUrl: prismaProduct.imageUrl ?? undefined,
    lowStockThreshold: prismaProduct.lowStockThreshold ?? undefined,
    tags: prismaProduct.tags ? JSON.parse(prismaProduct.tags as string) : [],
    // category field is now an object if included, or just categoryId
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

// Helper to map Prisma Category to App Category
const mapPrismaCategoryToAppCategory = (dbCategory: any): Category => {
  return {
    ...dbCategory,
    createdAt: dbCategory.createdAt.toISOString(),
    updatedAt: dbCategory.updatedAt.toISOString(),
  };
};


export async function fetchAllProductsAction(includeCategory: boolean = true): Promise<Product[]> {
  try {
    const dbProducts = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: {
        category: includeCategory, // Include category data based on parameter
      },
    });
    console.log('Product', dbProducts)
    return dbProducts.map(mapPrismaProductToAppProduct);
  } catch (error) {
    console.error('Failed to fetch products action:', error);
    throw new Error('Could not fetch products.');
  }
}

export async function createProductAction(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>): Promise<Product> {
  try {
    const { tags, categoryId, ...restOfData } = productData;
    const newDbProduct = await prisma.product.create({
      data: {
        ...restOfData,
        tags: tags ? JSON.stringify(tags) : JSON.stringify([]),
        ...(categoryId && { categoryId: categoryId }),
      },
      include: { category: true },
    });
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
    if (categoryId !== undefined) { // Handle empty string as null or disconnect
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
    // Optionally, find the product first to revalidate its category path
    const product = await prisma.product.findUnique({ where: { id: productId }, include: { category: true } });
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

export async function decreaseProductStockAction(productId: string, quantityToDecrease: number): Promise<Product> {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found for stock decrease.");

    const newQuantity = Math.max(0, product.quantity - quantityToDecrease);
    
    const updatedDbProduct = await prisma.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
      include: { category: true },
    });
    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);
    revalidatePath('/pos'); 
    revalidatePath('/admin/products'); 
    if (updatedDbProduct.category) {
        revalidatePath(`/inventory?category=${encodeURIComponent(updatedDbProduct.category.name)}`);
    }
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
      include: { category: true },
    });
    revalidatePath('/inventory');
    revalidatePath(`/inventory/${productId}`);
    revalidatePath('/purchasing'); 
    revalidatePath('/admin/products');
     if (updatedDbProduct.category) {
        revalidatePath(`/inventory?category=${encodeURIComponent(updatedDbProduct.category.name)}`);
    }
    return mapPrismaProductToAppProduct(updatedDbProduct);
  } catch (error) {
    console.error('Failed to increase product stock action:', error);
    throw new Error('Could not increase product stock.');
  }
}

// This function is now deprecated in favor of fetching from the Category table.
// Kept for reference or if a quick list from products is ever needed again without relations.
export async function fetchDistinctProductCategories_DEPRECATED(): Promise<string[]> {
  try {
    const categories = await prisma.product.findMany({
      select: {
        // category: true, // This field is removed
        // Instead, if you wanted to get categories products are assigned to:
        // category: { select: { name: true }} // but this needs grouping
      },
      // distinct: ['category'], // This field is removed
      // orderBy: {
      //   category: 'asc',
      // },
      // where: {
      //   category: {
      //     not: null, 
      //     notIn: [''], 
      //   }
      // }
    });
    // This logic needs complete rewrite if based on Product table.
    // For now, returning empty as it's deprecated.
    console.warn("fetchDistinctProductCategories_DEPRECATED is called. Use fetchCategories from Category actions instead.")
    return [];
  } catch (error) {
    console.error('Failed to fetch product categories (deprecated):', error);
    return []; 
  }
}

// New action to fetch categories from the Category table
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
