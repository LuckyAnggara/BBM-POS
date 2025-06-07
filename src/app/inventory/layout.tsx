
'use client';
import { AppShell } from '@/components/layout/app-shell';
import type { ReactNode } from 'react';

// Layout ini membungkus halaman-halaman inventory.
// Jika direktori 'inventory' berada di luar grup '(app)' (misalnya src/app/inventory/),
// layout ini akan menyediakan AppShell yang diperlukan (termasuk PageTitleProvider).
//
// Jika 'inventory' sudah berada di dalam grup '(app)' (yaitu di src/app/(app)/inventory/),
// maka AppShell sudah disediakan oleh src/app/(app)/layout.tsx.
// Dalam kasus tersebut, layout spesifik ini (src/app/(app)/inventory/layout.tsx)
// sebaiknya disederhanakan menjadi hanya <>{children}</> atau dihapus sama sekali
// untuk menghindari duplikasi AppShell.
//
// Untuk saat ini, kita asumsikan AppShell mungkin dibutuhkan di sini untuk mengatasi error.
export default function InventoryLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
