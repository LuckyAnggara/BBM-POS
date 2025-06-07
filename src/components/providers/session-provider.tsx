
'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth'; // Import Session type from next-auth
import type { ReactNode } from 'react';

interface NextAuthSessionProviderProps {
  children: ReactNode;
  session?: Session | null; // Make session prop optional and allow null
}

export default function NextAuthSessionProvider({ children, session }: NextAuthSessionProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
