
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic middleware example.
// Authentication logic has been removed.
// You can customize this middleware for other purposes if needed.
export function middleware(request: NextRequest) {
  // Example: Log the path for every request
  // console.log('Middleware accessed path:', request.nextUrl.pathname);

  // Allow all requests to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * This is a broad matcher. Adjust if you have specific API routes or other paths
     * that should not pass through this middleware.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
