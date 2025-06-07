
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider  from 'next-auth/providers/credentials';
import  Credentials  from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
// Import PrismaUser explicitly if needed for type hints, though `user` in authorize will be inferred
// import type { User as PrismaDbUser } from '@prisma/client'; 

export const authConfig: NextAuthConfig = {
  debug: true, // Enable debug messages for NextAuth
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("Authorize: Attempting to authorize user with credentials:", JSON.stringify(credentials ? { email: credentials.email } : {}, null, 2));
        if (!credentials?.email || !credentials.password) {
          console.error("Authorize: Missing email or password in credentials.");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const userFromDb = await prisma.user.findUnique({
            where: { email: email },
          });

          if (!userFromDb) {
            console.log("Authorize: User not found for email:", email);
            return null;
          }
          if (!userFromDb.password) {
            console.log("Authorize: User found but has no password set:", email);
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, userFromDb.password);

          if (!isValidPassword) {
            console.log("Authorize: Invalid password for email:", email);
            return null;
          }
          
          if (!userFromDb.isActive) {
            console.log("Authorize: User account is inactive:", email);
            // throw new Error("User account is inactive."); // This will be caught by NextAuth
            // Return null to let NextAuth handle it as generic credentials error, 
            // or it will redirect to error page with "AccessDenied" if pages.error is set.
            // For a custom message on error page, throw an error that you specifically check for on the error page.
            // For now, this will result in a generic "CredentialsSignin" error unless handled by a custom error page logic based on a specific throw.
             throw new Error("User account is inactive."); // This should route to error page with error=Error: User account is inactive.
          }
          
          // Update lastLogin timestamp
          try {
            await prisma.user.update({
              where: { id: userFromDb.id },
              data: { lastLogin: new Date() },
            });
            console.log("Authorize: Updated lastLogin for user:", email);
          } catch (updateError) {
            console.error("Authorize: Failed to update lastLogin for user:", email, updateError);
            // Decide if this is critical. For now, we'll proceed with login even if lastLogin update fails.
          }
          
          const userToReturn = {
            id: userFromDb.id,
            name: userFromDb.name,
            email: userFromDb.email,
            image: userFromDb.image,
            role: userFromDb.role, 
            isActive: !!userFromDb.isActive, // Ensure isActive is strictly boolean
          };
          console.log("Authorize: User authenticated successfully. Returning user object:", JSON.stringify(userToReturn, null, 2));
          return userToReturn;

        } catch (dbError) {
          console.error("Authorize: Database error during user lookup for email:", email, dbError);
          return null; // Or throw an error to indicate a server problem
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session:  updateSessionData }) {
      console.log("JWT Callback -- Start --");
      console.log("JWT Callback - Trigger:", trigger);
      console.log("JWT Callback - Input Token (before modification):", JSON.stringify(token, null, 2));
      console.log("JWT Callback - Input User (from authorize/OAuth, only on sign in/link):", JSON.stringify(user, null, 2));
      // console.log("JWT Callback - Input Account (OAuth only):", JSON.stringify(account, null, 2));
      // console.log("JWT Callback - Input Profile (OAuth only):", JSON.stringify(profile, null, 2));
      // console.log("JWT Callback - Input Session for update (if trigger is 'update'):", JSON.stringify(updateSessionData, null, 2));

      if (user) { // This block runs on initial sign-in (credentials or OAuth)
        // token.id = user.id; 
        token.role = user.role; 
        token.isActive = user.isActive; 
        // Default fields like name, email, picture are usually handled by NextAuth if present on user
        if (user.name) token.name = user.name;
        if (user.email) token.email = user.email;
        if (user.image) token.picture = user.image; // NextAuth JWT typically uses 'picture'
      }
      
      if (trigger === "update" && updateSessionData?.user) {
        console.log("JWT Callback: Updating token based on session update data:", JSON.stringify(updateSessionData.user, null, 2));
        // Merge the session update data into the token
        if (updateSessionData.user.name) token.name = updateSessionData.user.name;
        if (updateSessionData.user.email) token.email = updateSessionData.user.email;
        if (updateSessionData.user.image) token.picture = updateSessionData.user.image;
        // For custom fields, ensure they are part of what `update()` can send
        if (typeof (updateSessionData.user as any).role !== 'undefined') token.role = (updateSessionData.user as any).role;
        if (typeof (updateSessionData.user as any).isActive === 'boolean') token.isActive = (updateSessionData.user as any).isActive;
      }

      console.log("JWT Callback - Output Token (after modification):", JSON.stringify(token, null, 2));
      console.log("JWT Callback -- End --");
      return token;
    },
    async session({ session, token }) {
      console.log("Session Callback -- Start --");
      console.log("Session Callback - Input Session (before modification):", JSON.stringify(session, null, 2));
      console.log("Session Callback - Input Token (from jwt callback):", JSON.stringify(token, null, 2));

      if (!session.user) {
        session.user = {} as any; 
      }
      
      // Assign standard fields from token
      // NextAuth maps token.sub to session.user.id by default if not using adapter for session user
      // but since we have token.id, we can use that.
      // session.user.id = token.sub || token.id as string; // Ensure ID is set, prefer custom token.id
      if (token.id) session.user.id = token.id as string;
      else if (token.sub) session.user.id = token.sub;


      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture) session.user.image = token.picture; // Map token.picture to session.user.image

      // Assign custom fields from token to session.user
      if (typeof token.role !== 'undefined') { // Handles null explicitly
        session.user.role = token.role as string | null;
      } else {
        session.user.role = null; // Default to null if not on token
      }

      if (typeof token.isActive === 'boolean') {
        session.user.isActive = token.isActive;
      } else {
        session.user.isActive = false; // Default to false if not on token (or handle as error)
      }
      
      console.log("Session Callback - Output Session (after modification):", JSON.stringify(session, null, 2));
      console.log("Session Callback -- End --");
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', 
  },
  secret: process.env.AUTH_SECRET, 
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

    