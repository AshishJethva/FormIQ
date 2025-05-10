import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // If user is on home page (/) and not authenticated, redirect to login
  if (pathname === '/' && !token) {
    return NextResponse.redirect(new URL('auth/login', request.url));
  }

  // If user is on home page (/) and authenticated, redirect to dashboard
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (
    token &&
    (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and tries to access protected routes
  if (!token && pathname.startsWith('/dashboard')) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
