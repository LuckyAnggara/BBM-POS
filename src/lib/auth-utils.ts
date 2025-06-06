
'use server'; // Still useful here as it's a server-side utility that uses server-only functions

import { cookies } from 'next/headers';
import type { User } from '@/lib/types'; // Ensure this path is correct

export async function getSession(): Promise<{ user: User; session: string } | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('auth_session');

  if (!sessionCookie?.value) {
    return null;
  }
  try {
    // Assuming the session cookie directly stores the JSON string of the User object
    const parsedSession = JSON.parse(sessionCookie.value) as User; 
    return { user: parsedSession, session: sessionCookie.value };
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    // Optionally, delete the malformed cookie
    // cookieStore.delete('auth_session'); 
    return null;
  }
}
