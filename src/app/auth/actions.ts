
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@/lib/types';
import { prisma } from '@/lib/prisma';

interface LoginResult {
  success: boolean;
  user?: User; // Use the full User type from lib/types
  error?: string;
}

export async function loginUser(credentials: { email?: string; password?: string }): Promise<LoginResult | void> {
  if (!credentials.email || !credentials.password) {
    return { success: false, error: 'Email dan password tidak boleh kosong.' };
  }

  const userFromDb = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (!userFromDb) {
    return { success: false, error: 'Email atau password salah.' };
  }

  // !!! SECURITY WARNING !!!
  // This is plain text password comparison. DO NOT USE IN PRODUCTION.
  // In a real application, you MUST hash passwords during registration
  // and compare the hash of the provided password with the stored hash.
  // Example using a library like bcrypt:
  // const passwordMatch = await bcrypt.compare(credentials.password, userFromDb.password);
  // if (!passwordMatch) { ... }
  const passwordMatch = credentials.password === userFromDb.password;

  if (passwordMatch) {
    if (!userFromDb.isActive) {
      return { success: false, error: 'Akun pengguna ini tidak aktif.' };
    }

    // Map Prisma user to application User type for session
    const sessionUser: User = {
      id: userFromDb.id,
      name: userFromDb.name,
      email: userFromDb.email,
      role: userFromDb.role, // Prisma User 'role' is string, maps directly
      avatarUrl: userFromDb.avatarUrl,
      isActive: userFromDb.isActive,
      // Do not store password in session
      createdAt: userFromDb.createdAt.toISOString(),
      updatedAt: userFromDb.updatedAt.toISOString(),
      lastLogin: userFromDb.lastLogin?.toISOString() ?? null,
    };
    
    // Update lastLogin timestamp
    await prisma.user.update({
      where: { id: userFromDb.id },
      data: { lastLogin: new Date() },
    });

    const sessionData = JSON.stringify(sessionUser);
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
