
'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE_NAME = 'stockpilot-session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

interface LoginResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Updated loginUser to accept email and password
export async function loginUser(email: string, password?: string): Promise<LoginResult> {
  if (!email) {
    return { success: false, error: 'Email is required.' };
  }
  if (!password) {
    return { success: false, error: 'Password is required.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'User not found with this email.' };
    }
    
    if (!user.password) {
      // This case might occur if a user was created without a password (e.g., old data)
      console.error(`User ${email} does not have a password set.`);
      return { success: false, error: 'Authentication configuration error for this user.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid password.' };
    }

    if (!user.isActive) {
      return { success: false, error: 'This user account is inactive.' };
    }

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

    // Update lastLogin (optional, but good practice)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
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
  redirect('/login');
}

export async function getSessionDataFromServer(): Promise<{ userId: string; userName: string; userEmail: string | null; userRole: string; } | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    try {
      const sessionData = JSON.parse(sessionCookie.value);
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
