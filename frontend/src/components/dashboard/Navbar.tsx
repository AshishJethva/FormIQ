'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Logo from '@/../public/Logo.png';
import ProfileDropdown from './ProfileDropdown';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<'templates' | 'support' | null>(
    null
  );
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get active page from pathname
  const getActivePage = (path: string) => {
    if (path.includes('/templates')) return 'templates';
    if (path.includes('/support')) return 'support';
    if (path.includes('/pricing')) return 'pricing';
    return 'dashboard';
  };
  const [activePage, setActivePage] = useState(getActivePage(pathname || ''));

  // Update active page when pathname changes
  useEffect(() => {
    setActivePage(getActivePage(pathname || ''));
  }, [pathname]);

  const handleMouseEnter = (menuName: 'templates' | 'support') => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpenMenu(menuName);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 150);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.header
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className='bg-[#102035] text-[#FFFFFF] px-4 sm:px-6 py-3 border-b border-navy-800'
    >
      <div className='flex items-center justify-between h-10'>
        {/* Left section - Logo and workspace */}
        <div className='flex items-center space-x-3 sm:space-x-6'>
          <Link href='/dashboard' className='flex items-center cursor-pointer'>
            <Image
              src={Logo}
              alt='Logo'
              height={54}
              priority
              className='h-8 sm:h-[54px] w-auto'
            />
            <span className='font-bold text-lg sm:text-2xl mr-2'>FormIQ</span>
          </Link>

          <Link
            href='/dashboard'
            className='hidden sm:flex items-center cursor-pointer hover:text-gray-200'
          >
            <span className='text-md text-[#FFFFFF] hover:text-[#ff6100] transition-colors duration-150'>
              My Workspace
            </span>
          </Link>
        </div>

        {/* Right section - Navigation items */}
        <div className='flex items-center space-x-3 sm:space-x-7'>
          <div className='hidden sm:block'>
            <Popover
              open={openMenu === 'templates'}
              onOpenChange={open => !open && setOpenMenu(null)}
            >
              <PopoverTrigger asChild>
                <div
                  className={`flex items-center cursor-pointer relative ${
                    activePage === 'templates'
                      ? 'after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-0.5 after:bg-[#ff6100]'
                      : ''
                  }`}
                  onMouseEnter={() => handleMouseEnter('templates')}
                  onMouseLeave={handleMouseLeave}
                >
                  <span className='text-sm text-[#FFFFFF] hover:text-[#ff6100] transition-colors duration-150 flex items-center gap-1'>
                    Templates
                    <ChevronDown
                      className={`h-4 w-4 ${
                        openMenu === 'templates' ? 'text-[#ff6100]' : ''
                      } transition-colors duration-150`}
                    />
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent
                onMouseEnter={() => handleMouseEnter('templates')}
                onMouseLeave={handleMouseLeave}
                className='w-71 p-0 bg-white text-gray-800 border rounded-md shadow-lg'
                align='center'
                sideOffset={7}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className='p-4'
                >
                  <h3 className='text-xs font-semibold text-gray-500 mb-2'>
                    TEMPLATES
                  </h3>
                  <div className='grid grid-cols-1 gap-4'>
                    <Link href='/templates/form' className='block'>
                      <motion.div
                        whileHover={{ backgroundColor: '#f3f4f6' }}
                        className='flex items-center p-2 rounded-md cursor-pointer transition-colors'
                      >
                        <div className='bg-orange-500 rounded-full p-2 mr-3'>
                          <svg
                            className='h-5 w-5 text-white'
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <rect
                              x='3'
                              y='3'
                              width='18'
                              height='18'
                              rx='2'
                              ry='2'
                            ></rect>
                            <line x1='3' y1='9' x2='21' y2='9'></line>
                            <line x1='9' y1='21' x2='9' y2='9'></line>
                          </svg>
                        </div>
                        <span className='text-sm'>Form Templates</span>
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Support dropdown - Hidden on mobile */}
          <div className='hidden sm:block'>
            <Popover
              open={openMenu === 'support'}
              onOpenChange={open => !open && setOpenMenu(null)}
            >
              <PopoverTrigger asChild>
                <div
                  className={`flex items-center cursor-pointer relative ${
                    activePage === 'support'
                      ? 'after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-0.5 after:bg-[#ff6100]'
                      : ''
                  }`}
                  onMouseEnter={() => handleMouseEnter('support')}
                  onMouseLeave={handleMouseLeave}
                >
                  <span className='text-sm text-[#FFFFFF] hover:text-[#ff6100] transition-colors duration-150 flex items-center gap-1'>
                    Support
                    <ChevronDown
                      className={`h-4 w-4 ${
                        openMenu === 'support' ? 'text-[#ff6100]' : ''
                      } transition-colors duration-150`}
                    />
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent
                className='w-71 p-0 bg-white text-gray-800 border rounded-md shadow-lg'
                onMouseEnter={() => handleMouseEnter('support')}
                onMouseLeave={handleMouseLeave}
                align='center'
                sideOffset={7}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className='grid grid-cols-2 gap-4 p-3'
                >
                  <div>
                    <h3 className='text-xs font-semibold text-gray-500 mb-3'>
                      GET HELP
                    </h3>
                    <ul className='space-y-2'>
                      <li className='hover:text-blue-600 cursor-pointer'>
                        <Link href='/support/contact' className='block w-full'>
                          Contact Support
                        </Link>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Pricing link */}
          <Link href='/myaccount/upgrade'>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`cursor-pointer relative ${
                activePage === 'pricing'
                  ? 'after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-0.5 after:bg-[#ff6100]'
                  : ''
              }`}
            >
              <span className='text-sm text-[#FFFFFF] hover:text-[#ff6100] transition-colors duration-150'>
                Pricing
              </span>
            </motion.div>
          </Link>

          {/* Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </div>
    </motion.header>
  );
}
