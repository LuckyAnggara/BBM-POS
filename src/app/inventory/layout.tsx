
'use client';
import { AppShell } from '@/components/layout/app-shell';
import type { ReactNode } from 'react';

// This layout wraps inventory pages.
// It ensures AppShell (including PageTitleProvider) is available.
export default function InventoryLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
