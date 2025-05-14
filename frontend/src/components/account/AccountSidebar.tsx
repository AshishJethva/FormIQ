// src/components/account/AccountSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Settings,
  ShieldCheck,
  Users,
  CreditCard,
  Link2,
  Database,
  History,
  Code,
  BarChart2,
} from 'lucide-react';

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
      icon: <User className='h-5 w-5 text-gray-600' />,
      label: 'Account',
      href: '/myaccount',
    },
    {
      icon: <Settings className='h-5 w-5 text-gray-600' />,
      label: 'Settings',
      href: '/myaccount/settings',
    },
    {
      icon: <ShieldCheck className='h-5 w-5 text-gray-600' />,
      label: 'Security',
      href: '/myaccount/security',
    },
    {
      icon: <Users className='h-5 w-5 text-gray-600' />,
      label: 'Users',
      href: '/myaccount/users',
    },
    {
      icon: <CreditCard className='h-5 w-5 text-gray-600' />,
      label: 'Upgrade',
      href: '/myaccount/upgrade',
    },
    {
      icon: <Link2 className='h-5 w-5 text-gray-600' />,
      label: 'Connections',
      href: '/myaccount/connections',
      badge: 'NEW',
    },
    {
      icon: <Database className='h-5 w-5 text-gray-600' />,
      label: 'Data',
      href: '/myaccount/data',
    },
    {
      icon: <History className='h-5 w-5 text-gray-600' />,
      label: 'History',
      href: '/myaccount/history',
    },
    {
      icon: <Code className='h-5 w-5 text-gray-600' />,
      label: 'API',
      href: '/myaccount/api',
    },
    {
      icon: <BarChart2 className='h-5 w-5 text-gray-600' />,
      label: 'Usage',
      href: '/myaccount/usage',
    },
  ];

  return (
    <div className='w-64 bg-[#EFF1F7]'>
      {sidebarItems.map((item, index) => (
        <Link key={index} href={item.href}>
          <div
            className={`flex items-center px-6 py-3 cursor-pointer ${
              pathname === item.href
                ? 'bg-white'
                : 'hover:bg-gray-200 hover:bg-opacity-50'
            }`}
          >
            {item.icon}
            <span className='ml-3 text-sm font-medium text-gray-700'>
              {item.label}
            </span>
            {item.badge && (
              <span className='ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded'>
                {item.badge}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default AccountSidebar;
