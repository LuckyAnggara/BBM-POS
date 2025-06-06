
import type { ReactNode } from 'react';

// Layout ini tidak menggunakan AppShell agar POS bisa tampil full screen.
// RootLayout (src/app/layout.tsx) tetap akan membungkus layout ini,
// jadi Toaster dan pengaturan global lainnya masih berlaku.

export default function POSLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-muted/30">
      {/* 
        Tidak ada AppShell di sini.
        Children akan menjadi src/app/pos/page.tsx 
      */}
      {children}
    </div>
  );
}
