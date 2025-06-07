
'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

const SESSION_COOKIE_NAME = 'stockpilot-session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

interface LoginResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function loginUser(email: string): Promise<LoginResult> {
  if (!email) {
    return { success: false, error: 'Email is required.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'User not found with this email.' };
    }

    if (!user.isActive) {
      return { success: false, error: 'This user account is inactive.' };
    }

    // Basic session data
    const sessionData = {
      userId: user.id,
      userName: user.name || 'User',
      userEmail: user.email,
      userRole: user.role || 'STAFF',
    };

    cookies().set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
    });

    return { success: true, message: 'Login successful!' };

  } catch (error) {
    console.error('Login action error:', error);
    return { success: false, error: 'An internal server error occurred.' };
  }
}

export async function logoutUser() {
  try {
    cookies().delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error("Error during logout (clearing cookie):", error);
  }
  // Redirect to login page after logout
  redirect('/login');
}

export async function getSessionDataFromServer(): Promise<{ userId: string; userName: string; userEmail: string | null; userRole: string; } | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      // Basic validation of session data structure
      if (sessionData.userId && sessionData.userName) {
        return sessionData;
      }
      return null;
    } catch (error) {
      console.error('Failed to parse session cookie:', error);
      return null;
    }
  }
  return null;
}

    