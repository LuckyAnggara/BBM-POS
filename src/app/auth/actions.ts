
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation'; // Import redirect
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

export async function loginUser(credentials: { email?: string; password?: string }): Promise<LoginResult | void> { // Return type updated
  if (!credentials.email || !credentials.password) {
    return { success: false, error: 'Email dan password tidak boleh kosong.' };
  }

  if (credentials.email === MOCK_EMAIL && credentials.password === MOCK_PASSWORD) {
    const mockUser: Omit<User, 'createdAt' | 'updatedAt' | 'lastLogin' | 'role'> & { role: string } = {
      id: 'user_admin_alice', // from seed
      name: 'Admin User',
      email: MOCK_EMAIL,
      role: 'ADMIN',
      avatarUrl: 'https://placehold.co/80x80/7F56D9/FFFFFF.png?text=AU',
      isActive: true,
    };

    const sessionData = JSON.stringify({ userId: mockUser.id, email: mockUser.email, name: mockUser.name, role: mockUser.role });
    cookies().set('auth_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'lax',
    });

    redirect('/'); // Perform redirect from server action
  }

  return { success: false, error: 'Email atau password salah.' };
}

export async function logoutUser() {
  cookies().delete('auth_session');
  redirect('/login');
}
