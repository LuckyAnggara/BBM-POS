
'use server';

import { prisma } from '@/lib/prisma';
import type { Category } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const mapPrismaCategoryToAppCategory = (dbCategory: any): Category => {
  return {
    ...dbCategory,
    createdAt: dbCategory.createdAt.toISOString(),
    updatedAt: dbCategory.updatedAt.toISOString(),
  };
};

export async function fetchCategories(): Promise<Category[]> {
  try {
    const dbCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return dbCategories.map(mapPrismaCategoryToAppCategory);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw new Error('Could not fetch categories.');
  }
}

export async function createCategory(name: string): Promise<Category> {
  try {
    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      throw new Error(`Category "${name}" already exists.`);
    }

    const newDbCategory = await prisma.category.create({
      data: { name },
    });
    revalidatePath('/admin/categories');
    revalidatePath('/inventory/add'); // Revalidate pages that use category dropdown
    revalidatePath('/inventory'); // Revalidate inventory page for sidebar categories
    revalidatePath('/admin/products'); // Revalidate admin products page
    // Potentially revalidate product edit pages if they are open.
    return mapPrismaCategoryToAppCategory(newDbCategory);
  } catch (error) {
    console.error('Failed to create category:', error);
    if (error instanceof Error && error.message.includes("already exists")) {
        throw error;
    }
    throw new Error('Could not create category.');
  }
}

// Future actions: updateCategory, deleteCategory
