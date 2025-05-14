'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Logo from '@/../public/Logo.png';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState<'templates' | 'support' | null>(
    null
  );
  const [activePage, setActivePage] = useState('dashboard');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    }, 100);
  };

  // Mock user data - in a real app, this would come from auth context or API
  const userData = {
    userName: 'Ashish Coder',
    userImage: null, // Default image path, replace with actual image
    planType: 'STARTER',
    formsUsed: 2,
    formsTotal: 5,
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
    <header className='bg-[#102035] text-[#FFFFFF] px-6 py-3 border-b border-navy-800'>
      <div className='flex items-center justify-between h-10'>
        {/* Left section - Logo and workspace */}
        <div className='flex items-center space-x-6'>
          <div className='flex items-center'>
            <Image src={Logo} alt='Logo' height={54} />
            <span className='font-bold text-2xl mr-2'>FormIQ</span>
          </div>

          <div className='flex items-center cursor-pointer hover:text-gray-200'>
            <span className='text-md text-[#FFFFFF] hover:text-[#ff6100] transition-colors duration-150'>
              My Workspace
            </span>
          </div>
        </div>

        {/* Right section - Navigation items */}
        <div className='flex items-center space-x-7'>
          {/* Templates dropdown */}
          <Popover
            open={openMenu === 'templates'}
            onOpenChange={() => setOpenMenu(null)}
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
              className='w-80 p-0 bg-white text-gray-800 border rounded-md shadow-lg'
              align='center'
              sideOffset={7}
            >
              {/* Templates dropdown content */}
              <div className='p-4'>
                <h3 className='text-xs font-semibold text-gray-500 mb-2'>
                  TEMPLATES
                </h3>
                <div className='grid grid-cols-1 gap-4'>
                  <div className='flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer'>
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
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Support dropdown */}
          <Popover
            open={openMenu === 'support'}
            onOpenChange={() => setOpenMenu(null)}
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
              className='w-96 p-0 bg-white text-gray-800 border rounded-md shadow-lg'
              onMouseEnter={() => handleMouseEnter('support')}
              onMouseLeave={handleMouseLeave}
              align='center'
              sideOffset={7}
            >
              {/* Support dropdown content */}
              <div className='grid grid-cols-2 gap-4 p-4'>
                <div>
                  <h3 className='text-xs font-semibold text-gray-500 mb-3'>
                    GET HELP
                  </h3>
                  <ul className='space-y-2'>
                    <li className='hover:text-blue-600 cursor-pointer'>
                      Contact Support
                    </li>
                    <li className='hover:text-blue-600 cursor-pointer'>
                      My Support Requests
                    </li>
                    <li className='hover:text-blue-600 cursor-pointer'>
                      Help Center
                    </li>
                    <li className='hover:text-blue-600 cursor-pointer'>FAQ</li>
                  </ul>
                </div>
                <div>
                  <h3 className='text-xs font-semibold text-gray-500 mb-3'>
                    LEARN
                  </h3>
                  <ul className='space-y-2'>
                    <li className='hover:text-blue-600 cursor-pointer'>
                      User Guide
                    </li>
                    <li className='hover:text-blue-600 cursor-pointer'>
                      FormIQ Books
                    </li>
                    <li className='hover:text-blue-600 cursor-pointer'>Blog</li>
                    <li className='hover:text-blue-600 cursor-pointer'>
                      Videos
                    </li>
                    <li className='hover:text-blue-600 cursor-pointer'>
                      FormIQ Academy
                    </li>
                  </ul>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Pricing link */}
          <div
            className={`cursor-pointer relative ${
              activePage === 'pricing'
                ? 'after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-0.5 after:bg-[#ff6100]'
                : ''
            }`}
            onClick={() => setActivePage('pricing')}
          >
            <span className='text-sm text-[#FFFFFF] hover:text-[#ff6100] transition-colors duration-150'>
              Pricing
            </span>
          </div>

          {/* Profile Dropdown */}
          <ProfileDropdown
            userName={userData.userName}
            userImage={userData.userImage}
            planType={userData.planType}
            formsUsed={userData.formsUsed}
            formsTotal={userData.formsTotal}
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
