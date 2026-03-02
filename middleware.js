import { NextResponse } from 'next/server';
import { verifyToken } from './src/lib/auth';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (pathname.startsWith('/signin') || pathname.startsWith('/signup')) {
    // If already logged in, redirect to home
    if (token && verifyToken(token)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!token || !verifyToken(token)) {
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};