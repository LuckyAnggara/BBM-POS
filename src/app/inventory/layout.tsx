
import type { ReactNode } from 'react';

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Common header for inventory section can be added here later if needed */}
      {children}
    </div>
  );
}
