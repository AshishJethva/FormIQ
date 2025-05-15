'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Import only the icons we actually use
import { UserIcon, SettingsIcon, ArrowUpCircle, ClockIcon } from 'lucide-react';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string | null;
}

const AccountSidebar = () => {
  const pathname = usePathname();

  const sidebarItems: SidebarItem[] = [
    {
      icon: <UserIcon className='h-5 w-5' />,
      label: 'Account',
      href: '/myaccount',
    },
    {
      icon: <SettingsIcon className='h-5 w-5' />,
      label: 'Settings',
      href: '/myaccount/settings',
    },
    {
      icon: <ArrowUpCircle className='h-5 w-5' />,
      label: 'Upgrade',
      href: '/myaccount/upgrade',
    },
    {
      icon: <ClockIcon className='h-5 w-5' />,
      label: 'History',
      href: '/myaccount/history',
    },
  ];

  return (
    <div className='w-64 bg-[#EFF1F7] min-h-screen border-r border-[#D8DEF3]'>
      <div className='pt-6 pb-2 px-4'>
        <h2 className='text-lg font-semibold text-[#364168] px-2'>
          My Account
        </h2>
      </div>
      <div className='mt-2'>
        {sidebarItems.map((item, index) => {
          const isActive = pathname === item.href;

          return (
            <Link key={index} href={item.href}>
              <div
                className={`
                  flex items-center px-6 py-3.5 cursor-pointer mb-1 mx-2 rounded-md
                  transition-all duration-200 ease-in-out
                  ${
                    isActive
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-[#dfe3f0] hover:bg-opacity-50'
                  }
                `}
              >
                <div
                  className={`
                  ${isActive ? 'text-[#4f5cd1]' : 'text-gray-600'} 
                  transition-colors
                `}
                >
                  {item.icon}
                </div>
                <span
                  className={`
                  ml-3 font-medium 
                  ${isActive ? 'text-[#364168]' : 'text-gray-700'}
                `}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span className='ml-auto bg-[#4f5cd1] text-white text-xs px-2 py-0.5 rounded font-medium'>
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AccountSidebar;
