
import type { ReactNode } from 'react';

export default function SalesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Common header for sales section can be added here later if needed */}
      {children}
    </div>
  );
}
