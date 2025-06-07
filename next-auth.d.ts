
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: string | null; // Prisma role is String?, so null is possible
      isActive: boolean;   // Made non-optional as we ensure it's boolean in authorize
    } & DefaultSession["user"]; // name, email, image from DefaultSession["user"]
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the object returned by the `authorize` function in the Credentials provider.
   */
  interface User extends DefaultUser { // Extends DefaultUser (id, name, email, image)
    role: string | null; // Custom field
    isActive: boolean;   // Custom field
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT extends DefaultJWT { // Extends DefaultJWT (name, email, picture, sub)
    id: string; // Custom field for user ID (can also use `sub` which is standard)
    role: string | null; // Custom field
    isActive: boolean;   // Custom field
    // name, email, picture are part of DefaultJWT
  }
}

    