
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/', '/inventory', '/admin', '/pos', '/purchasing', '/sales']; // Add all routes that need auth
const PUBLIC_ROUTES = ['/login']; // Routes accessible without auth

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('auth_session');

  const isAuthenticated = !!sessionCookie;

  // If trying to access a protected route without a session, redirect to login
  if (!isAuthenticated && PROTECTED_ROUTES.some(route => pathname.startsWith(route) && !(pathname === '/' && PROTECTED_ROUTES.length === 1 && route === '/'))) {
    // Special case for exact match on '/' if it's the only protected route or part of many
    if (pathname === '/' && PROTECTED_ROUTES.includes('/')) {
         return NextResponse.redirect(new URL('/login', request.url));
    } else if (pathname !== '/') { // Avoid redirecting '/' to '/login' if '/' is not explicitly protected or other protected routes exist
        // Check if the current path starts with any of the protected base paths
        const isBasePathProtected = PROTECTED_ROUTES.some(protectedPath => pathname.startsWith(protectedPath) && protectedPath !== '/');
        if (isBasePathProtected) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }
  }


  // If authenticated and trying to access a public route (like /login), redirect to dashboard
  if (isAuthenticated && PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
