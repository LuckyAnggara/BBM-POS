
'use server';

import { prisma } from '@/lib/prisma';
import type { ExpenseCategory } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const mapPrismaExpenseCategoryToApp = (dbCategory: any): ExpenseCategory => {
  return {
    ...dbCategory,
    createdAt: dbCategory.createdAt.toISOString(),
    updatedAt: dbCategory.updatedAt.toISOString(),
  };
};

export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  try {
    const dbCategories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return dbCategories.map(mapPrismaExpenseCategoryToApp);
  } catch (error) {
    console.error('Failed to fetch expense categories:', error);
    throw new Error('Could not fetch expense categories.');
  }
}

export async function createExpenseCategory(name: string): Promise<ExpenseCategory> {
  try {
    const existingCategory = await prisma.expenseCategory.findUnique({
      where: { name },
    });

    if (existingCategory) {
      throw new Error(`Expense category "${name}" already exists.`);
    }

    const newDbCategory = await prisma.expenseCategory.create({
      data: { name },
    });
    revalidatePath('/admin/expenses/categories');
    revalidatePath('/expenses/add'); // Revalidate page that uses category dropdown
    return mapPrismaExpenseCategoryToApp(newDbCategory);
  } catch (error) {
    console.error('Failed to create expense category:', error);
    if (error instanceof Error && error.message.includes("already exists")) {
        throw error;
    }
    throw new Error('Could not create expense category.');
  }
}

// Placeholder for delete action
export async function deleteExpenseCategory(id: string): Promise<void> {
  try {
    // Before deleting a category, ensure no expenses are linked to it, or reassign them.
    // For simplicity, this example doesn't handle that. In a real app, you must.
    const expensesWithCategory = await prisma.expense.count({
        where: { expenseCategoryId: id}
    });
    if (expensesWithCategory > 0) {
        throw new Error("Cannot delete category. It is currently assigned to one or more expenses.");
    }

    await prisma.expenseCategory.delete({
      where: { id },
    });
    revalidatePath('/admin/expenses/categories');
  } catch (error) {
    console.error('Failed to delete expense category:', error);
     if (error instanceof Error && error.message.includes("Cannot delete category")) {
        throw error;
    }
    throw new Error('Could not delete expense category.');
  }
}

    