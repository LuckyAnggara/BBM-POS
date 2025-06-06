
import type { ReactNode } from 'react';

export default function ExpensesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Common header for expenses section can be added here if needed */}
      {children}
    </div>
  );
}

    