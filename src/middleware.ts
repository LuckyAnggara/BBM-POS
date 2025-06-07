
import { NextResponse, type NextRequest } from 'next/server';
import { getUserSession } from '@/lib/user-session'; // Import the new session helper

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/api/']; // Add any other public paths or API routes

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path)) || pathname === '/';


  // Attempt to get session data
  // Note: getUserSession uses `cookies()` from `next/headers` which works in Middleware
  let session = null;
  try {
    session = await getUserSession();
  } catch (error) {
    // If cookies() throws (e.g. not a request context), treat as no session
    console.warn('Middleware: Failed to get user session, possibly not in a request context or error:', error);
  }
  

  // If trying to access a protected path without a session, redirect to login
  if (!isPublicPath && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname); // Optional: redirect back after login
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access login page with an active session, redirect to dashboard
  if (isPublicPath && pathname.startsWith('/login') && session) {
     return NextResponse.redirect(new URL('/', request.url));
  }

  // Add user session to request headers if available, so Server Components can access it
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (assuming you have a public/assets folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets).*)',
  ],
};

    