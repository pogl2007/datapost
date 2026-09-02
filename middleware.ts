import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

// Uses the edge-safe config directly (not lib/auth.ts) since middleware runs
// on the Edge runtime and lib/auth.ts pulls in Prisma via the Credentials provider.
const { auth } = NextAuth(authConfig);

const PROTECTED_PATHS = ['/upload', '/report', '/dashboard', '/history', '/subscription'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isProtectedPage = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isProtectedApi = pathname.startsWith('/api') && !pathname.startsWith('/api/auth');

  if ((isProtectedPage || isProtectedApi) && !req.auth) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const loginUrl = new URL('/auth/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/upload/:path*',
    '/report/:path*',
    '/dashboard/:path*',
    '/history/:path*',
    '/subscription/:path*',
    '/api/:path*',
  ],
};
