'use client';

import '@/styles/globals.css';
import { useEffect } from 'react';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { token } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [token]);

  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
