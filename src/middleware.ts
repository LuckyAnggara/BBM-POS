
import { NextResponse, type NextRequest } from 'next/server';
import { getUserSession } from '@/lib/user-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/api/']; 
  const isStrictlyPublicPath = publicPaths.some(path => pathname.startsWith(path));
  const isRootPath = pathname === '/';

  let session = null;
  try {
    session = await getUserSession();
  } catch (error) {
    console.warn('Middleware: Failed to get user session:', error);
  }
  
  // If trying to access a protected path without a session, redirect to login
  // The root path "/" is public, so it won't be caught here.
  if (!isStrictlyPublicPath && !isRootPath && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access login page with an active session, redirect to dashboard
  if (pathname.startsWith('/login') && session) {
     return NextResponse.redirect(new URL('/dashboard', request.url)); // Redirect to /dashboard
  }

  const requestHeaders = new Headers(request.headers);
  if (session) {
    requestHeaders.set('x-user-session', JSON.stringify(session));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
