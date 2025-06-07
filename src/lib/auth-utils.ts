
'use server';
// This file can be deprecated or merged into src/lib/auth.ts
// For now, we'll keep it to re-export to minimize changes in other files,
// but ideally, components/actions would import directly from '@/lib/auth'.

import { auth } from '@/lib/auth';
import type { User } from '@/lib/types'; // Your app's User type

export async function getSession(): Promise<{ user: User & { id: string, role?: string | null, isActive?: boolean } } | null> {
  const session = await auth(); // auth() returns the session object from NextAuth

  if (!session || !session.user) {
    return null;
  }

  // Ensure the user object matches your app's User type structure,
  // especially if you've augmented the session in NextAuth callbacks.
  return { 
    user: {
      ...session.user, // Spread existing session.user properties (name, email, image)
      id: session.user.id, // Ensure id is correctly mapped
      role: session.user.role, // Ensure role is correctly mapped
      // Map other fields from your app's User type if they exist on session.user
      // For example, if your User type has avatarUrl but session.user.image is used:
      avatarUrl: session.user.image,
      isActive: session.user.isActive,
      // These might not be on the session user object by default or from your callbacks
      // Adjust based on what's available and needed.
      // createdAt: session.user.createdAt?.toISOString() || new Date().toISOString(), // Example, likely not on session
      // updatedAt: session.user.updatedAt?.toISOString() || new Date().toISOString(), // Example
      // lastLogin: session.user.lastLogin?.toISOString() || null, // Example
    } as User & { id: string, role?: string | null, isActive?: boolean } // Cast to ensure type compatibility
  };
}

// You can also export a more direct user fetching function
export async function getCurrentAuthenticatedUser(): Promise<(User & { id: string, role?: string | null, isActive?: boolean }) | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as (User & { id: string, role?: string | null, isActive?: boolean });
}
