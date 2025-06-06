
'use server';

import { prisma } from '@/lib/prisma';
import type { Expense, ExpenseCategory, User as AppUser } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth-utils';
import { Decimal } from '@prisma/client/runtime/library';

const mapPrismaUserToAppUser = (prismaUser: any): AppUser | undefined => {
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

const mapPrismaExpenseCategoryToApp = (dbCategory: any): ExpenseCategory => {
  return {
    ...dbCategory,
    createdAt: dbCategory.createdAt.toISOString(),
    updatedAt: dbCategory.updatedAt.toISOString(),
  };
};

const mapPrismaExpenseToApp = (dbExpense: any): Expense => {
  return {
    id: dbExpense.id,
    date: dbExpense.date.toISOString(),
    description: dbExpense.description,
    amount: dbExpense.amount.toNumber(),
    expenseCategoryId: dbExpense.expenseCategoryId,
    category: mapPrismaExpenseCategoryToApp(dbExpense.category),
    userId: dbExpense.userId,
    user: dbExpense.user ? mapPrismaUserToAppUser(dbExpense.user) : undefined,
    notes: dbExpense.notes ?? null,
    createdAt: dbExpense.createdAt.toISOString(),
    updatedAt: dbExpense.updatedAt.toISOString(),
  };
};

export interface FetchExpensesFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}

export async function fetchExpenses(filters?: FetchExpensesFilters): Promise<Expense[]> {
  try {
    const whereClause: any = {};
    if (filters?.startDate) {
      whereClause.date = { ...whereClause.date, gte: new Date(filters.startDate) };
    }
    if (filters?.endDate) {
      const endDateObj = new Date(filters.endDate);
      endDateObj.setHours(23, 59, 59, 999); // End of day
      whereClause.date = { ...whereClause.date, lte: endDateObj };
    }
    if (filters?.categoryId && filters.categoryId !== 'all') {
      whereClause.expenseCategoryId = filters.categoryId;
    }

    const dbExpenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        category: true,
        user: true,
      },
      orderBy: { date: 'desc' },
    });
    return dbExpenses.map(mapPrismaExpenseToApp);
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    throw new Error('Could not fetch expenses.');
  }
}

export interface ExpenseCreationData {
  date: Date;
  description: string;
  amount: number;
  expenseCategoryId: string;
  notes?: string | null;
}

export async function createExpense(data: ExpenseCreationData): Promise<Expense> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("User not authenticated to record an expense.");
  }
  const userId = session.user.id;

  try {
    const newDbExpense = await prisma.expense.create({
      data: {
        date: data.date,
        description: data.description,
        amount: new Decimal(data.amount),
        expenseCategoryId: data.expenseCategoryId,
        userId: userId,
        notes: data.notes,
      },
      include: { category: true, user: true },
    });
    revalidatePath('/expenses');
    revalidatePath('/reports/income-statement'); // Expenses affect income statement
    return mapPrismaExpenseToApp(newDbExpense);
  } catch (error) {
    console.error('Failed to create expense:', error);
    throw new Error('Could not create expense.');
  }
}

// Placeholder for deleteExpense
export async function deleteExpense(expenseId: string): Promise<void> {
    try {
        await prisma.expense.delete({
            where: {id: expenseId}
        });
        revalidatePath('/expenses');
        revalidatePath('/reports/income-statement');
    } catch (error) {
        console.error('Failed to delete expense:', error);
        throw new Error('Could not delete expense.');
    }
}

export async function fetchAllExpenseCategoriesAction(): Promise<ExpenseCategory[]> {
  try {
    const dbCategories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return dbCategories.map(mapPrismaExpenseCategoryToApp);
  } catch (error) {
    console.error('Failed to fetch expense categories for dropdown:', error);
    throw new Error('Could not fetch expense categories.');
  }
}

    