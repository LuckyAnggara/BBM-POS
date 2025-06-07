
'use server';

import { prisma } from '@/lib/prisma';
import type { AppSettings } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const DEFAULT_SETTINGS_ID = 'main_settings';

// Helper to map Prisma AppSettings to App AppSettings type
const mapPrismaSettingsToAppSettings = (prismaSettings: any): AppSettings => {
  return {
    ...prismaSettings,
    // Ensure numeric fields are converted from Decimal to number
    defaultTaxRate: prismaSettings.defaultTaxRate ? prismaSettings.defaultTaxRate.toNumber() : 0,
    // currencyDecimalPlaces is already Int in Prisma, so direct assignment is fine
    currencyDecimalPlaces: prismaSettings.currencyDecimalPlaces, 
    createdAt: prismaSettings.createdAt.toISOString(),
    updatedAt: prismaSettings.updatedAt.toISOString(),
  };
};


export async function fetchAppSettings(): Promise<AppSettings> {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: DEFAULT_SETTINGS_ID },
    });

    if (!settings) {
      // If no settings exist, create them with default values
      settings = await prisma.appSettings.create({
        data: {
          id: DEFAULT_SETTINGS_ID,
          appName: 'StockPilot',
          dateFormat: 'MM/dd/yyyy',
          timeZone: 'America/New_York',
          defaultCurrency: 'USD',
          currencySymbol: '$',
          currencySuffix: '',
          currencyDecimalPlaces: 2,
          emailNotifications: true,
          lowStockAlerts: true,
          newOrderAlerts: false,
          defaultTaxRate: 0, 
        },
      });
      console.log('Default app settings created.');
    }
    return mapPrismaSettingsToAppSettings(settings);
  } catch (error) {
    console.error('Failed to fetch app settings:', error);
    throw new Error('Could not fetch app settings.');
  }
}

// Accepts partial data to update only specific fields
export async function saveAppSettings(data: Partial<Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AppSettings> {
  try {
    const updatedSettings = await prisma.appSettings.update({
      where: { id: DEFAULT_SETTINGS_ID },
      data: {
        ...data,
        // Ensure conversion to number for numeric fields if provided
        defaultTaxRate: data.defaultTaxRate !== undefined ? Number(data.defaultTaxRate) : undefined,
        currencyDecimalPlaces: data.currencyDecimalPlaces !== undefined ? Number(data.currencyDecimalPlaces) : undefined,
      }
    });
    revalidatePath('/admin/settings');
    // Potentially revalidate other paths if settings affect them
    revalidatePath('/pos');
    revalidatePath('/sales/history');
    revalidatePath('/reports/income-statement');
    return mapPrismaSettingsToAppSettings(updatedSettings);
  } catch (error) {
    console.error('Failed to save app settings:', error);
    throw new Error('Could not save app settings.');
  }
}
