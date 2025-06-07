
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

console.log(`[auth.ts] Top-level: Prisma client imported: ${!!prisma}`);
console.log(`[auth.ts] Top-level: PrismaAdapter imported: ${typeof PrismaAdapter}`);
console.log(`[auth.ts] Top-level: CredentialsProvider imported: ${typeof CredentialsProvider}`);

// const initializedPrismaAdapter = PrismaAdapter(prisma);
// console.log(`[auth.ts] Initialized PrismaAdapter: ${typeof initializedPrismaAdapter}`, initializedPrismaAdapter ? Object.keys(initializedPrismaAdapter) : null);

const credentialsProviderConfig = CredentialsProvider({
  name: 'Credentials',
  credentials: {
    email: { label: 'Email', type: 'email', placeholder: 'jsmith@example.com' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    console.log("[auth.ts] Authorize: Attempting with credentials:", JSON.stringify(credentials ? { email: credentials.email } : {}, null, 2));
    if (!credentials?.email || !credentials.password) {
      console.error("[auth.ts] Authorize: Missing email or password.");
      return null;
    }

    const email = credentials.email as string;
    const password = credentials.password as string;

    try {
      const userFromDb = await prisma.user.findUnique({
        where: { email: email },
      });

      if (!userFromDb) {
        console.log("[auth.ts] Authorize: User not found:", email);
        return null;
      }
      if (!userFromDb.password) {
        console.log("[auth.ts] Authorize: User has no password set (this should not happen with seeded users):", email);
        return null; // Or throw new Error("Password not set for user.");
      }

      const isValidPassword = await bcrypt.compare(password, userFromDb.password);

      if (!isValidPassword) {
        console.log("[auth.ts] Authorize: Invalid password for user:", email);
        return null;
      }
      
      if (!userFromDb.isActive) {
        console.log("[auth.ts] Authorize: User account is inactive:", email);
        // For custom error page handling, throw a specific error type or message recognized by NextAuth.js
        // For now, returning null will lead to a generic error, which is fine for debugging.
        // Later, you can throw an error that your /auth/error page can specifically handle.
        throw new Error("User account is inactive.");
      }
      
      // Update lastLogin timestamp
      try {
        await prisma.user.update({
          where: { id: userFromDb.id },
          data: { lastLogin: new Date() },
        });
        console.log("[auth.ts] Authorize: Updated lastLogin for user:", email);
      } catch (updateError) {
        console.error("[auth.ts] Authorize: Failed to update lastLogin:", email, updateError);
        // Non-fatal error, proceed with login
      }
      
      const userToReturn = {
        id: userFromDb.id,
        name: userFromDb.name,
        email: userFromDb.email,
        image: userFromDb.image, // Ensure image is included
        role: userFromDb.role, // Ensure role is included
        isActive: !!userFromDb.isActive, // Ensure isActive is explicitly boolean
      };
      console.log("[auth.ts] Authorize: User authenticated successfully. Returning user object:", JSON.stringify(userToReturn, null, 2));
      return userToReturn;

    } catch (dbError: any) {
      if (dbError.message === "User account is inactive.") {
          console.warn("[auth.ts] Authorize: Caught inactive user error, re-throwing for NextAuth to handle.");
          throw dbError; 
      }
      console.error("[auth.ts] Authorize: Database or bcrypt error during authorization:", email, dbError);
      // Returning null signals an authorization failure to NextAuth.js
      return null; 
    }
  },
});
console.log(`[auth.ts] Initialized CredentialsProvider config: ${typeof credentialsProviderConfig}`, credentialsProviderConfig ? Object.keys(credentialsProviderConfig) : null);


export const authConfig: NextAuthConfig = {
  debug: process.env.NODE_ENV !== 'production', 
  // adapter: initializedPrismaAdapter, // Temporarily removed for debugging
  providers: [
    credentialsProviderConfig,
  ],
  session: {
    strategy: 'jwt',
  },
  // callbacks: { // Temporarily removed for debugging
  //   async jwt({ token, user, trigger, session: updateSessionData }) {
  //     console.log("[auth.ts] JWT Callback -- Trigger:", trigger);
  //     // console.log("[auth.ts] JWT Callback - Input Token (start):", JSON.stringify(token, null, 2));
  //     // console.log("[auth.ts] JWT Callback - Input User (on sign in):", JSON.stringify(user, null, 2));

  //     if (user) { // On initial sign-in, 'user' object is available
  //       token.id = user.id;
  //       token.role = user.role;
  //       token.isActive = !!user.isActive; // Ensure boolean
  //       // Standard fields (name, email, picture) are usually handled by NextAuth by default if present on user
  //       if (user.name) token.name = user.name;
  //       if (user.email) token.email = user.email;
  //       if (user.image) token.picture = user.image; // NextAuth maps 'image' to 'picture' in token
  //     }
      
  //     // Handle session updates if you use `useSession().update()`
  //     if (trigger === "update" && updateSessionData?.user) {
  //       console.log("[auth.ts] JWT Callback: Updating token based on session update data:", JSON.stringify(updateSessionData.user, null, 2));
  //       if (updateSessionData.user.name) token.name = updateSessionData.user.name;
  //       if (updateSessionData.user.email) token.email = updateSessionData.user.email;
  //       if (updateSessionData.user.image) token.picture = updateSessionData.user.image;
        
  //       // Explicitly update custom fields if they are part of the update payload
  //       // Type assertion might be needed if `updateSessionData.user` doesn't perfectly match your augmented JWT type
  //       const customUpdateData = updateSessionData.user as { role?: string | null; isActive?: boolean };
  //       if (typeof customUpdateData.role !== 'undefined') token.role = customUpdateData.role;
  //       if (typeof customUpdateData.isActive === 'boolean') token.isActive = customUpdateData.isActive;
  //     }
  //     // console.log("[auth.ts] JWT Callback - Output Token (end):", JSON.stringify(token, null, 2));
  //     return token;
  //   },
  //   async session({ session, token }) {
  //     // console.log("[auth.ts] Session Callback -- Input Session (start):", JSON.stringify(session, null, 2));
  //     // console.log("[auth.ts] Session Callback -- Input Token:", JSON.stringify(token, null, 2));

  //     if (!session.user) { // Initialize session.user if it doesn't exist
  //       session.user = {} as any; // Cast to allow adding properties
  //     }
      
  //     // Standard fields that NextAuth might already populate if in token:
  //     if (token.name) session.user.name = token.name;
  //     if (token.email) session.user.email = token.email;
  //     if (token.picture) session.user.image = token.picture; // NextAuth maps 'picture' back to 'image' in session

  //     // Custom fields:
  //     if (token.id) {
  //       session.user.id = token.id as string;
  //     } else if (token.sub) { // Fallback to 'sub' if 'id' is not explicitly set in token
  //       session.user.id = token.sub;
  //     }

  //     session.user.role = (typeof token.role !== 'undefined' ? token.role : null) as string | null;
  //     session.user.isActive = (typeof token.isActive === 'boolean' ? token.isActive : false);
      
  //     // console.log("[auth.ts] Session Callback - Output Session (end):", JSON.stringify(session, null, 2));
  //     return session;
  //   },
  // },
  pages: {
    signIn: '/login',
    error: '/auth/error', 
  },
  secret: process.env.AUTH_SECRET, 
};
console.log(`[auth.ts] AuthConfig object created. Secret set: ${!!process.env.AUTH_SECRET}`);

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Helper to get current user from server components or route handlers
export async function getCurrentUser() {
  const sessionData = await auth(); 
  return sessionData?.user;
}
