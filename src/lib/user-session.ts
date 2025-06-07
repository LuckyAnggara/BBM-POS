
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'stockpilot-session';

export interface UserSessionData {
  userId: string;
  userName: string;
  userEmail: string | null;
  userRole: string;
}

export async function getUserSession(): Promise<UserSessionData | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    try {
      const sessionData = JSON.parse(sessionCookie.value) as UserSessionData;
      // Basic validation of session data structure
      if (sessionData && sessionData.userId && sessionData.userName) {
        return sessionData;
      }
      console.warn('Session cookie found but data is invalid:', sessionData);
      return null;
    } catch (error) {
      console.error('Failed to parse session cookie:', error);
      // Corrupted cookie, good idea to delete it
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }
  }
  return null;
}

// This client-side hook is a bit tricky because cookies are httpOnly by default
// For simplicity, we'll rely on NavUser being a server component or getting session via props
// Or, we could have a separate client-readable cookie if NavUser must be client-side and dynamic.
// For now, let's assume NavUser will get its data via server rendering or props.

    