
import type { ReactNode } from 'react';

// This layout is for authentication pages like login
// It provides a minimal structure, typically centered.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      {children}
    </div>
  );
}
