
'use server';

import { prisma } from '@/lib/prisma';
import type { User, UserRole } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Helper to map Prisma User to App User type
const mapPrismaUserToAppUser = (prismaUser: any): User => {
  return {
    ...prismaUser,
    role: prismaUser.role as UserRole, // Cast to our UserRole enum
    lastLogin: prismaUser.lastLogin?.toISOString() || null,
    createdAt: prismaUser.createdAt.toISOString(),
    updatedAt: prismaUser.updatedAt.toISOString(),
  };
};

export async function fetchUsers(): Promise<User[]> {
  try {
    const dbUsers = await prisma.user.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return dbUsers.map(mapPrismaUserToAppUser);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw new Error('Could not fetch users.');
  }
}

export async function deleteUserById(userId: string): Promise<void> {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath('/admin/users');
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw new Error('Could not delete user.');
  }
}

export async function updateUserActiveStatus(userId: string, isActive: boolean): Promise<User> {
  try {
    const updatedDbUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
    revalidatePath('/admin/users');
    return mapPrismaUserToAppUser(updatedDbUser);
  } catch (error) {
    console.error('Failed to update user status:', error);
    throw new Error('Could not update user status.');
  }
}
