
'use server';

import { prisma } from '@/lib/prisma';
import type { IncomeStatementData } from '@/lib/types';
import { endOfDay, startOfDay } from 'date-fns';

export async function fetchIncomeStatementData(
  startDate: Date,
  endDate: Date
): Promise<IncomeStatementData> {
  try {
    const adjustedStartDate = startOfDay(startDate);
    const adjustedEndDate = endOfDay(endDate);

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

    let totalRevenue = 0;
    let totalCogs = 0;

    sales.forEach(sale => {
      totalRevenue += sale.grandTotal.toNumber();
      sale.items.forEach(item => {
        // Ensure costPriceAtSale is a number and item quantity is valid
        const costPrice = item.costPriceAtSale?.toNumber() ?? 0;
        totalCogs += costPrice * item.quantity;
      });
    });

    const grossProfit = totalRevenue - totalCogs;
    // For now, operating expenses are 0
    // const operatingExpenses = 0; 
    const netIncome = grossProfit; // - operatingExpenses;

    return {
      revenue: totalRevenue,
      cogs: totalCogs,
      grossProfit: grossProfit,
      netIncome: netIncome,
      startDate: adjustedStartDate.toISOString(),
      endDate: adjustedEndDate.toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch income statement data:', error);
    throw new Error('Could not generate income statement.');
  }
}
