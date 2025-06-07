
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { User as PrismaUser } from '@prisma/client'; // Use PrismaUser type for authorize

export const authConfig: NextAuthConfig = {
  debug:true,
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
          console.log("Authorize: User not found or no password for email:", email);
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          console.log("Authorize: Invalid password for email:", email);
          return null;
        }
        
        if (!user.isActive) {
          console.log("Authorize: User account is inactive:", email);
          // NextAuth by default will show a generic error.
          // To show a custom error, you'd throw an error here and handle it in the error page.
          // For example: throw new Error("User account is inactive.");
          // This will then be caught by NextAuth and can be displayed on your custom error page.
          // For now, we'll rely on the error page's default or specific "AccessDenied" handling.
          throw new Error("User account is inactive.");
        }
        
        // Update lastLogin timestamp without returning it in the authorize object
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        console.log("Authorize: User authenticated successfully:", email);
        // Return only the fields NextAuth expects or that you'll pass to the JWT
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role, 
          isActive: !!user.isActive, // Ensure isActive is strictly boolean
        };
      },
    }),
    // Add other providers like Google, GitHub etc. here if needed
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      console.log("JWT Callback - Input Token:", JSON.stringify(token, null, 2));
      console.log("JWT Callback - Input User:", JSON.stringify(user, null, 2));

      if (user) {
        // Cast user to 'any' or a more specific type if you know what `user` object contains here
        // This usually runs on sign-in
        const customUser = user as any; // Or define a more specific type for `user` in this context
        token.id = customUser.id;
        token.role = customUser.role;
        token.isActive = !!customUser.isActive; // Ensure isActive is strictly boolean
      }
      
      console.log("JWT Callback - Output Token:", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token, user }) {
      // `user` in the session callback is the user from the database (if using database sessions)
      // or the user object from the JWT token (if using JWT sessions without database persistence for session object)
      console.log("Session Callback - Input Session:", JSON.stringify(session, null, 2));
      console.log("Session Callback - Input Token:", JSON.stringify(token, null, 2));
      // console.log("Session Callback - Input User (from token/db):", JSON.stringify(user, null, 2));


      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      if (session.user && token.role) {
        session.user.role = token.role as string;
      }
      if (session.user && typeof token.isActive === 'boolean') {
        session.user.isActive = token.isActive; // Already boolean from JWT callback
      }

      console.log("Session Callback - Output Session:", JSON.stringify(session, null, 2));
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error', // Optional: custom error page
  },
  secret: process.env.AUTH_SECRET, // Ensure AUTH_SECRET is set in .env
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Helper function to get current server session
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}
