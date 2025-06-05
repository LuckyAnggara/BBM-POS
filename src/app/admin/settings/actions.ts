
'use server';

import { prisma } from '@/lib/prisma';
import type { AppSettings } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const DEFAULT_SETTINGS_ID = 'main_settings';

// Helper to map Prisma AppSettings to App AppSettings type
const mapPrismaSettingsToAppSettings = (prismaSettings: any): AppSettings => {
  return {
    ...prismaSettings,
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
          // Default values are set in schema, but can be overridden here if needed
          appName: 'StockPilot',
          dateFormat: 'MM/dd/yyyy',
          timeZone: 'America/New_York',
          defaultCurrency: 'USD',
          emailNotifications: true,
          lowStockAlerts: true,
          newOrderAlerts: false,
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
      data: data,
    });
    revalidatePath('/admin/settings');
    return mapPrismaSettingsToAppSettings(updatedSettings);
  } catch (error) {
    console.error('Failed to save app settings:', error);
    throw new Error('Could not save app settings.');
  }
}
