
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth'; // Import auth from your NextAuth config

const PROTECTED_ROUTES_PREFIXES = ['/inventory', '/admin', '/pos', '/purchasing', '/sales'];
const ROOT_ROUTE = '/';
const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const session = await auth(); // Get session using NextAuth.js
  const isAuthenticated = !!session?.user;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = 
    pathname === ROOT_ROUTE || 
    PROTECTED_ROUTES_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname); // Pass original path as callback
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL(ROOT_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, but we need to protect /api/auth for internal NextAuth use)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * We explicitly allow /api/auth to ensure NextAuth functions correctly.
     * Other /api routes could be protected by checking session within their handlers.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/session).*)', 
    // Exclude /api/auth/session as it's public for session checks by NextAuth client
    // /api/auth/* other routes are handled by NextAuth itself.
  ],
};
