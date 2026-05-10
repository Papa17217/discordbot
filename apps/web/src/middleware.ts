// ============================================
// Next.js Middleware — Auth redirect
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Paths that don't need auth
  const publicPaths = ['/', '/login', '/auth', '/api'];
  const isPublic = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isPublic) {
    return NextResponse.next();
  }

  // Client-side auth check will handle the rest
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
