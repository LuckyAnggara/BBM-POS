
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma as actualPrismaInstance } from '@/lib/prisma'; // Renamed for clarity
import { PrismaClient } from '@prisma/client'; // For instanceof check
import bcrypt from 'bcryptjs';
import type { User as AppUserType } from '@/lib/types'; // Your application's User type

console.log(`[auth.ts] Top-level: Prisma client (actualPrismaInstance) imported: ${!!actualPrismaInstance}`);
console.log(`[auth.ts] Top-level: PrismaClient constructor imported: ${typeof PrismaClient}`);
console.log(`[auth.ts] Top-level: PrismaAdapter imported: ${typeof PrismaAdapter}`);
console.log(`[auth.ts] Top-level: CredentialsProvider imported: ${typeof CredentialsProvider}`);

// Log details about the actualPrismaInstance
if (actualPrismaInstance) {
  console.log(`[auth.ts] Actual Prisma instance type: ${typeof actualPrismaInstance}`);
  console.log(`[auth.ts] Actual Prisma instance instanceof PrismaClient: ${actualPrismaInstance instanceof PrismaClient}`);
  console.log(`[auth.ts] Actual Prisma instance keys: ${Object.keys(actualPrismaInstance || {}).join(', ')}`);
} else {
  console.error("[auth.ts] CRITICAL: actualPrismaInstance is null or undefined!");
}

const initializedPrismaAdapter = PrismaAdapter(actualPrismaInstance);
console.log(`[auth.ts] Initialized PrismaAdapter: ${typeof initializedPrismaAdapter}`, initializedPrismaAdapter ? Object.keys(initializedPrismaAdapter).join(', ') : null);

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
      const userFromDb = await actualPrismaInstance.user.findUnique({
        where: { email: email },
      });

      if (!userFromDb) {
        console.log("[auth.ts] Authorize: User not found:", email);
        return null;
      }
      if (!userFromDb.password) {
        console.log("[auth.ts] Authorize: User has no password set:", email);
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, userFromDb.password);

      if (!isValidPassword) {
        console.log("[auth.ts] Authorize: Invalid password for user:", email);
        return null;
      }
      
      if (!userFromDb.isActive) {
        console.log("[auth.ts] Authorize: User account is inactive:", email);
        throw new Error("User account is inactive.");
      }
      
      try {
        await actualPrismaInstance.user.update({
          where: { id: userFromDb.id },
          data: { lastLogin: new Date() },
        });
        console.log("[auth.ts] Authorize: Updated lastLogin for user:", email);
      } catch (updateError) {
        console.error("[auth.ts] Authorize: Failed to update lastLogin:", email, updateError);
      }
      
      const userToReturn = {
        id: userFromDb.id,
        name: userFromDb.name,
        email: userFromDb.email,
        image: userFromDb.image,
        role: userFromDb.role,
        isActive: !!userFromDb.isActive, // Ensure boolean
      };
      console.log("[auth.ts] Authorize: User authenticated successfully. Returning user object:", JSON.stringify(userToReturn, null, 2));
      return userToReturn;

    } catch (dbError: any) {
      if (dbError.message === "User account is inactive.") {
          console.warn("[auth.ts] Authorize: Caught inactive user error, re-throwing for NextAuth to handle.");
          throw dbError; 
      }
      console.error("[auth.ts] Authorize: Database or bcrypt error during authorization:", email, dbError);
      return null; 
    }
  },
});
console.log(`[auth.ts] Initialized CredentialsProvider config: ${typeof credentialsProviderConfig}`, credentialsProviderConfig ? Object.keys(credentialsProviderConfig).join(', ') : null);


export const authConfig: NextAuthConfig = {
  debug: process.env.NODE_ENV !== 'production', 
  adapter: initializedPrismaAdapter,
  providers: [
    credentialsProviderConfig,
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session: updateSessionData }) {
      console.log("[auth.ts] JWT Callback -- Trigger:", trigger);
      // console.log("[auth.ts] JWT Callback - Input Token (start):", JSON.stringify(token, null, 2));
      // console.log("[auth.ts] JWT Callback - Input User (on sign in):", JSON.stringify(user, null, 2));

      if (user) { // On initial sign-in, 'user' object (from authorize) is available
        token.id = user.id;
        // Make sure AppUserType has role and isActive, and that 'user' object conforms to it.
        // The user object from authorize should match the structure expected here.
        const customUser = user as AppUserType & { isActive?: boolean, role?: string | null, id: string };
        token.role = customUser.role; 
        token.isActive = !!customUser.isActive; 
        
        if (customUser.name) token.name = customUser.name;
        if (customUser.email) token.email = customUser.email;
        if (customUser.image) token.picture = customUser.image;
      }
      
      if (trigger === "update" && updateSessionData?.user) {
        console.log("[auth.ts] JWT Callback: Updating token based on session update data:", JSON.stringify(updateSessionData.user, null, 2));
        if (updateSessionData.user.name) token.name = updateSessionData.user.name;
        if (updateSessionData.user.email) token.email = updateSessionData.user.email;
        if (updateSessionData.user.image) token.picture = updateSessionData.user.image;
        
        const customUpdateData = updateSessionData.user as { role?: string | null; isActive?: boolean };
        if (typeof customUpdateData.role !== 'undefined') token.role = customUpdateData.role;
        if (typeof customUpdateData.isActive === 'boolean') token.isActive = customUpdateData.isActive;
      }
      // console.log("[auth.ts] JWT Callback - Output Token (after modification):", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token }) {
      // console.log("[auth.ts] Session Callback -- Input Session (start):", JSON.stringify(session, null, 2));
      // console.log("[auth.ts] Session Callback -- Input Token:", JSON.stringify(token, null, 2));

      if (!session.user) { 
        session.user = {} as any; 
      }
      
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture) session.user.image = token.picture;

      if (token.id) {
        session.user.id = token.id as string;
      } else if (token.sub) { 
        session.user.id = token.sub;
      }

      session.user.role = (typeof token.role !== 'undefined' ? token.role : null) as string | null;
      session.user.isActive = (typeof token.isActive === 'boolean' ? token.isActive : false);
      
      // console.log("[auth.ts] Session Callback - Output Session (after modification):", JSON.stringify(session, null, 2));
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error', 
  },
  secret: process.env.AUTH_SECRET, 
};
console.log(`[auth.ts] AuthConfig object created. Secret set: ${!!process.env.AUTH_SECRET}`);

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getCurrentUser() {
  const sessionData = await auth(); 
  return sessionData?.user;
}

    