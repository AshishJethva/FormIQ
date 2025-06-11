'use client';

import type { RootState } from '@/redux/store';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';
import { PASSWORD_RESET_PATHS } from './constants';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isPasswordResetPage = PASSWORD_RESET_PATHS.some(path =>
    pathname.startsWith(path)
  );

  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user.token && !isPasswordResetPage) {
      router.replace('/dashboard');
    }
  }, [router, user.token, isPasswordResetPage]);

  if (!isMounted) return null;

  return <>{children}</>;
}
