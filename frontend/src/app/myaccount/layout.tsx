import React from 'react';
import { Metadata } from 'next';
import { Navbar } from '@/components/dashboard';
import AccountSidebar from '@/components/account/AccountSidebar';

export const metadata: Metadata = {
  title: 'My Account | FormIQ',
  description: 'Manage your FormIQ account settings and preferences',
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col min-h-screen bg-[#102035] mx-auto min-w-[80%]'>
      <Navbar />

      <div className='flex flex-1 overflow-hidden mx-auto min-w-[80%] my-5 bg-white rounded-md '>
        <AccountSidebar />

        <main className='flex-1 overflow-y-auto'>{children}</main>
      </div>
    </div>
  );
}
