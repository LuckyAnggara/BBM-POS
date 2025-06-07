
'use client';
import { AppShell } from '@/components/layout/app-shell';
import type { ReactNode } from 'react';

// This layout wraps all main application pages with the AppShell
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
