import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const otp_verification_pending = request.cookies.get(
    'otp_verification_pending'
  )?.value;

  if (
    pathname === '/auth/forgot-password' ||
    pathname === '/auth/reset-password' ||
    pathname.startsWith('/auth/forgot-password/') ||
    pathname.startsWith('/auth/reset-password/')
  ) {
    // Add a special header to indicate this is a password reset page
    const response = NextResponse.next();
    response.headers.set('x-allow-password-reset', 'true');
    return response;
  }

  // PRIORITY 2: Handle OTP verification
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

  // PRIORITY 3: Root path redirect
  if (pathname === '/' || pathname === '') {
    if (token && token !== 'undefined' && token !== 'null') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // else {
    //   return NextResponse.redirect(new URL('/auth/login', request.url));
    // }
  }

  // PRIORITY 4: Protected paths
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

  // PRIORITY 5: Auth paths when logged in (EXCLUDING password reset paths)
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
