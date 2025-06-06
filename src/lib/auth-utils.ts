
'use server';

import { cookies } from 'next/headers';
import type { User } from '@/lib/types';

// Renamed return type for clarity if needed, or keep as is if User type is directly stored
interface SessionPayload extends User {}

export async function getSession(): Promise<{ user: SessionPayload; session: string } | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('auth_session');

  if (!sessionCookie?.value) {
    return null;
  }
  try {
    // Assuming the session cookie directly stores the JSON string of the User object (or SessionPayload)
    const parsedSession = JSON.parse(sessionCookie.value) as SessionPayload;
    return { user: parsedSession, session: sessionCookie.value };
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    // Optionally, delete the malformed cookie
    // cookieStore.delete('auth_session');
    return null;
  }
}
