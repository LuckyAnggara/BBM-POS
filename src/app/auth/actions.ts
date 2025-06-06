
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@/lib/types';
import { prisma } from '@/lib/prisma'; // For potential future use with real DB lookup

// Mock credentials
const MOCK_EMAIL = 'admin@stockpilot.com';
const MOCK_PASSWORD = 'password'; // In a real app, use hashed passwords

interface LoginResult {
  success: boolean;
  user?: Omit<User, 'createdAt' | 'updatedAt' | 'lastLogin' | 'role'> & { role: string }; // Simplified for mock
  error?: string;
}

export async function loginUser(credentials: { email?: string; password?: string }): Promise<LoginResult> {
  if (!credentials.email || !credentials.password) {
    return { success: false, error: 'Email dan password tidak boleh kosong.' };
  }

  // In a real application, you would:
  // 1. Fetch user from database by email:
  //    const userFromDb = await prisma.user.findUnique({ where: { email: credentials.email } });
  // 2. If user exists, compare hashed password:
  //    const isValidPassword = await bcrypt.compare(credentials.password, userFromDb.passwordHash);
  // 3. If valid, create session / JWT.

  if (credentials.email === MOCK_EMAIL && credentials.password === MOCK_PASSWORD) {
    // Mock user data - in a real app, this comes from the database
    const mockUser: Omit<User, 'createdAt' | 'updatedAt' | 'lastLogin' | 'role'> & { role: string } = {
      id: 'user_admin_alice', // from seed
      name: 'Admin User',
      email: MOCK_EMAIL,
      role: 'ADMIN',
      avatarUrl: 'https://placehold.co/80x80/7F56D9/FFFFFF.png?text=AU',
      isActive: true,
    };

    // Create a session cookie
    const sessionData = JSON.stringify({ userId: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role });
    cookies().set('auth_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'lax',
    });

    return { success: true, user: mockUser };
  }

  return { success: false, error: 'Email atau password salah.' };
}

export async function logoutUser() {
  cookies().delete('auth_session');
  redirect('/login');
}

export async function getSession(): Promise<{ user: User; session: string } | null> {
  const sessionCookie = cookies().get('auth_session');
  if (!sessionCookie) {
    return null;
  }
  try {
    const parsedSession = JSON.parse(sessionCookie.value) as User; // Assuming session stores User-like structure
    return { user: parsedSession, session: sessionCookie.value };
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    return null;
  }
}
