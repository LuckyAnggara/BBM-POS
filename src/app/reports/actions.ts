
'use server';

import { prisma } from '@/lib/prisma';
import type { IncomeStatementData, PosSession, User as AppUser, CashTransaction, PosSessionStatusEnum as AppPosSessionStatusEnum } from '@/lib/types'; // Added PosSession, AppUser
import { PosSessionStatusEnum } from '@/lib/types';
import { endOfDay, startOfDay } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';

export async function fetchIncomeStatementData(
  startDate: Date,
  endDate: Date
): Promise<IncomeStatementData> {
  try {
    const adjustedStartDate = startOfDay(startDate);
    const adjustedEndDate = endOfDay(endDate);

    // Fetch Sales
    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: adjustedStartDate,
          lte: adjustedEndDate,
        },
        status: 'Completed', 
      },
      include: {
        items: true,
      },
    });

    let totalRevenue = new Decimal(0);
    let totalCogs = new Decimal(0);

    sales.forEach(sale => {
      totalRevenue = totalRevenue.plus(sale.grandTotal);
      sale.items.forEach(item => {
        const costPrice = item.costPriceAtSale ?? new Decimal(0);
        totalCogs = totalCogs.plus(costPrice.times(item.quantity));
      });
    });

    // Fetch Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: adjustedStartDate,
          lte: adjustedEndDate,
        },
      },
    });

    let totalOperatingExpenses = new Decimal(0);
    expenses.forEach(expense => {
      totalOperatingExpenses = totalOperatingExpenses.plus(expense.amount);
    });

    const grossProfit = totalRevenue.minus(totalCogs);
    const netIncome = grossProfit.minus(totalOperatingExpenses);

    return {
      revenue: totalRevenue.toNumber(),
      cogs: totalCogs.toNumber(),
      grossProfit: grossProfit.toNumber(),
      operatingExpenses: totalOperatingExpenses.toNumber(),
      netIncome: netIncome.toNumber(),
      startDate: adjustedStartDate.toISOString(),
      endDate: adjustedEndDate.toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch income statement data:', error);
    throw new Error('Could not generate income statement.');
  }
}

const mapPrismaUserToAppUserForReport = (prismaUser: any): AppUser | undefined => {
  if (!prismaUser) return undefined;
  return {
    id: prismaUser.id,
    name: prismaUser.name ?? 'Unknown User',
    email: prismaUser.email,
    // Minimal fields for report display
  };
};

// Minimal mapper for CashTransaction if needed for display, typically not in summary table
const mapPrismaCashTransactionToAppForReport = (dbCashTransaction: any): CashTransaction => {
    return {
        id: dbCashTransaction.id, // Ensure all required fields are mapped
        posSessionId: dbCashTransaction.posSessionId,
        userId: dbCashTransaction.userId,
        type: dbCashTransaction.type,
        amount: dbCashTransaction.amount.toNumber(),
        description: dbCashTransaction.description,
        saleId: dbCashTransaction.saleId,
        createdAt: dbCashTransaction.createdAt.toISOString(),
        // user and posSession relations are typically not needed for this specific mapping context
    };
};


const mapPrismaPosSessionToAppForReport = (dbPosSession: any): PosSession => {
  const expectedCash = dbPosSession.expectedCashInDrawer.toNumber();
  const countedCashVal = dbPosSession.countedCash?.toNumber() ?? null;
  // Calculate cashDifference only if countedCash is available and session is CLOSED
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
    status: dbPosSession.status as AppPosSessionStatusEnum, // Cast to imported enum
    createdAt: dbPosSession.createdAt.toISOString(),
    updatedAt: dbPosSession.updatedAt.toISOString(),
    user: dbPosSession.user ? mapPrismaUserToAppUserForReport(dbPosSession.user) : undefined,
    // cashTransactions are typically not included in the summary list to avoid large data transfer
    // If detailed view is needed, they can be fetched separately or included conditionally
    cashTransactions: [] // Default to empty or map if absolutely needed for summary
  };
};

export interface FetchShiftHistoryFilters {
    startDate?: string;
    endDate?: string;
    userId?: string;
}

export async function fetchShiftHistory(filters?: FetchShiftHistoryFilters): Promise<PosSession[]> {
  try {
    const whereClause: any = {};
    if (filters?.startDate) {
      whereClause.startTime = { ...whereClause.startTime, gte: startOfDay(new Date(filters.startDate)) };
    }
    if (filters?.endDate) {
      // If filtering by start time within a range
      if (whereClause.startTime) {
         whereClause.startTime.lte = endOfDay(new Date(filters.endDate));
      } else {
         whereClause.startTime = { lte: endOfDay(new Date(filters.endDate)) };
      }
    }
    if (filters?.userId && filters.userId !== 'all') {
      whereClause.userId = filters.userId;
    }

    const dbSessions = await prisma.posSession.findMany({
      where: whereClause,
      include: {
        user: true, // Include user data
        // cashTransactions: { orderBy: { createdAt: 'asc' } }, // Optional: include if needed for summary, but can be heavy
      },
      orderBy: { startTime: 'desc' },
    });
    return dbSessions.map(mapPrismaPosSessionToAppForReport);
  } catch (error) {
    console.error('Failed to fetch shift history:', error);
    throw new Error('Could not fetch shift history.');
  }
}
