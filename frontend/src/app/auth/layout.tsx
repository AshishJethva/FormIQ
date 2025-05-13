'use client';

import type { RootState } from '@/redux/store';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = React.useState(false);
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user.token) {
      router.replace('/dashboard');
    }
  }, [router, user.token]);

  if (!isMounted) return null;

  return <>{children}</>;
}
