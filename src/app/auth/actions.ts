
'use server';

import { signOut as nextAuthSignOut } from '@/lib/auth'; // Assuming signOut is exported from authConfig
import { redirect } from 'next/navigation';

// The loginUser action is no longer needed as signIn is handled client-side by next-auth/react
// or directly via the NextAuth.js API route for credentials.

export async function logoutUser() {
  try {
    await nextAuthSignOut({ redirect: false }); // Perform sign out without client-side redirect first
  } catch (error) {
    console.error("Error during sign out:", error);
    // Optionally handle error, though signout is usually robust
  }
  redirect('/login'); // Manually redirect after server-side signout logic
}
