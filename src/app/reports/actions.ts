
'use server';

import { prisma } from '@/lib/prisma';
import type { IncomeStatementData } from '@/lib/types';
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
        status: 'Completed', // Only include completed sales
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

    