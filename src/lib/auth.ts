
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { User as PrismaUser } from '@prisma/client'; // Use PrismaUser type for authorize

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email: email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return null;
        }
        
        if (!user.isActive) {
          throw new Error("User account is inactive.");
        }
        
        // Update lastLogin timestamp without returning it in the authorize object
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Return only the fields NextAuth expects or that you'll pass to the JWT
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role, // Include custom role
          isActive: user.isActive,
        };
      },
    }),
    // Add other providers like Google, GitHub etc. here if needed
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // id from authorize user object
        token.role = (user as any).role; // role from authorize user object
        token.isActive = (user as any).isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isActive = token.isActive as boolean;
        // You can add other properties from token to session.user if needed
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // error: '/auth/error', // Optional: custom error page
  },
  // secret: process.env.AUTH_SECRET, // Ensure AUTH_SECRET is set in .env
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Helper function to get current server session
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}
