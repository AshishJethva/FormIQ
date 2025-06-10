import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const otp_verification_pending = request.cookies.get(
    'otp_verification_pending'
  )?.value;

  // Handle OTP verification
  if (otp_verification_pending) {
    if (
      pathname === '/auth/verify' ||
      pathname === '/auth/login' ||
      pathname === '/auth/signup'
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/auth/verify', request.url));
  }

  // If at root path, always redirect
  if (pathname === '/' || pathname === '') {
    if (token && token !== 'undefined' && token !== 'null') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Handle protected paths
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/settings',
    '/forms',
    '/build',
    '/ai',
    '/templates/',
    '/myaccount',
    '/payment',
  ];
  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  );
  if (
    isProtectedPath &&
    (!token || token === 'undefined' || token === 'null')
  ) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle auth paths when user is already logged in
  const authPaths = ['/auth/login', '/auth/signup', '/auth/verify'];
  if (
    authPaths.includes(pathname) &&
    token &&
    token !== 'undefined' &&
    token !== 'null' &&
    !otp_verification_pending
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
