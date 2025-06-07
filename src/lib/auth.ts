
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
// import type { User as PrismaDbUser } from '@prisma/client';

console.log(`[auth.ts] Top-level: Prisma client imported: ${!!prisma}`);
console.log(`[auth.ts] Top-level: PrismaAdapter imported: ${typeof PrismaAdapter}`);
console.log(`[auth.ts] Top-level: CredentialsProvider imported: ${typeof CredentialsProvider}`);

const initializedPrismaAdapter = PrismaAdapter(prisma);
console.log(`[auth.ts] Initialized PrismaAdapter: ${typeof initializedPrismaAdapter}`, initializedPrismaAdapter ? Object.keys(initializedPrismaAdapter) : null);

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
        await prisma.user.update({
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
      console.log("[auth.ts] Authorize: User authenticated. Returning:", JSON.stringify(userToReturn, null, 2));
      return userToReturn;

    } catch (dbError: any) {
      // Catch specific error from throw for inactive user
      if (dbError.message === "User account is inactive.") {
          console.warn("[auth.ts] Authorize: Caught inactive user error, re-throwing.");
          throw dbError; // Re-throw to let NextAuth handle it via error page
      }
      console.error("[auth.ts] Authorize: Database or bcrypt error:", email, dbError);
      return null; 
    }
  },
});
console.log(`[auth.ts] Initialized CredentialsProvider config: ${typeof credentialsProviderConfig}`, credentialsProviderConfig ? Object.keys(credentialsProviderConfig) : null);


export const authConfig: NextAuthConfig = {
  debug: true, 
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
      // console.log("[auth.ts] JWT Callback - Input Token:", JSON.stringify(token, null, 2));
      // console.log("[auth.ts] JWT Callback - Input User (on sign in):", JSON.stringify(user, null, 2));
      // console.log("[auth.ts] JWT Callback - Update Session Data (on trigger='update'):", JSON.stringify(updateSessionData, null, 2));

      if (user) { // On initial sign-in
        token.id = user.id; 
        token.role = user.role; 
        token.isActive = !!user.isActive; 
        if (user.name) token.name = user.name;
        if (user.email) token.email = user.email;
        if (user.image) token.picture = user.image;
        console.log("[auth.ts] JWT Callback - Token populated from user object:", JSON.stringify(token, null, 2));
      }
      
      if (trigger === "update" && updateSessionData?.user) {
        console.log("[auth.ts] JWT Callback: Updating token based on session update data:", JSON.stringify(updateSessionData.user, null, 2));
        if (updateSessionData.user.name) token.name = updateSessionData.user.name;
        if (updateSessionData.user.email) token.email = updateSessionData.user.email;
        if (updateSessionData.user.image) token.picture = updateSessionData.user.image;
        // For custom fields, ensure they are part of what `update()` can send
        if (typeof (updateSessionData.user as any).role !== 'undefined') token.role = (updateSessionData.user as any).role;
        if (typeof (updateSessionData.user as any).isActive === 'boolean') token.isActive = (updateSessionData.user as any).isActive;
      }
      // console.log("[auth.ts] JWT Callback - Output Token:", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token }) {
      // console.log("[auth.ts] Session Callback -- Input Session:", JSON.stringify(session, null, 2));
      // console.log("[auth.ts] Session Callback -- Input Token:", JSON.stringify(token, null, 2));

      if (!session.user) {
        session.user = {} as any; 
      }
      
      if (token.id) session.user.id = token.id as string;
      else if (token.sub) session.user.id = token.sub; // Fallback to sub if id not present

      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture) session.user.image = token.picture;

      if (typeof token.role !== 'undefined') { 
        session.user.role = token.role as string | null;
      } else {
        session.user.role = null; 
      }

      if (typeof token.isActive === 'boolean') {
        session.user.isActive = token.isActive;
      } else {
        session.user.isActive = false; 
      }
      
      // console.log("[auth.ts] Session Callback - Output Session:", JSON.stringify(session, null, 2));
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
  const sessionData = await auth(); // Renamed to avoid conflict with session callback parameter
  return sessionData?.user;
}
