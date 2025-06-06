
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/', '/inventory', '/admin', '/pos', '/purchasing', '/sales']; // Add all routes that need auth
const PUBLIC_ROUTES = ['/login']; // Routes accessible without auth

export function middleware(request: NextRequest) {
  console.log('aaaaaaaaaaaaa')

  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('auth_session');
  const isAuthenticated = !!sessionCookie;

  // Determine if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/'; // Exact match for the root path
    }
    // For other routes, check if pathname is an exact match or a sub-path
    return pathname === route || pathname.startsWith(route + '/');
  });

  // If trying to access a protected route without a session, redirect to login
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
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
