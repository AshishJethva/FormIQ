'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserIcon,
  SettingsIcon,
  ArrowUpCircle,
  ClockIcon,
  Menu,
  X,
} from 'lucide-react';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string | null;
}

const AccountSidebar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const prevPathnameRef = useRef(pathname);

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

  // Initialize the component only once
  useEffect(() => {
    setHasInitialized(true);
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      setIsMobileMenuOpen(false);
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const SidebarContent = ({ showCloseButton = false }) => (
    <div className='h-full flex flex-col'>
      <motion.div
        className='pt-6 pb-4 px-4 lg:px-6 flex items-center justify-between'
        initial={hasInitialized ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: hasInitialized ? 0 : 0.3 }}
      >
        <h2 className='text-lg lg:text-xl font-semibold text-[#364168] px-2'>
          My Account
        </h2>
        {showCloseButton && (
          <motion.button
            onClick={toggleMobileMenu}
            className='p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors lg:hidden'
            aria-label='Close navigation menu'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className='h-5 w-5 text-gray-700' />
          </motion.button>
        )}
      </motion.div>

      <nav className='flex-1 mt-2 px-2 lg:px-4'>
        {sidebarItems.map((item, index) => {
          const isActive = pathname === item.href;

          return (
            <motion.div
              key={item.href} // Use href as key instead of index for stability
              initial={hasInitialized ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: hasInitialized ? 0 : 0.3,
                delay: hasInitialized ? 0 : index * 0.1,
              }}
            >
              <Link href={item.href}>
                <motion.div
                  className={`
                    flex items-center px-4 lg:px-6 py-3.5 cursor-pointer mb-2 mx-1 lg:mx-2 rounded-lg
                    transition-all duration-200 ease-in-out
                    ${
                      isActive
                        ? 'bg-white shadow-md border border-blue-100'
                        : 'hover:bg-[#dfe3f0] hover:bg-opacity-70 active:bg-[#d0d7ea]'
                    }
                  `}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  // Remove layout prop to reduce flashing
                >
                  <motion.div
                    className={`
                      ${isActive ? 'text-[#4f5cd1]' : 'text-gray-600'}
                      transition-colors flex-shrink-0
                    `}
                    whileHover={{ rotate: isActive ? 0 : 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.icon}
                  </motion.div>
                  <span
                    className={`
                      ml-3 font-medium text-sm lg:text-base
                      ${isActive ? 'text-[#364168]' : 'text-gray-700'}
                    `}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <motion.span
                      className='ml-auto bg-[#4f5cd1] text-white text-xs px-2 py-1 rounded-full font-medium flex-shrink-0'
                      initial={hasInitialized ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: hasInitialized ? 0 : 0.3,
                        delay: hasInitialized ? 0 : 0.2,
                      }}
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button - Only shown when sidebar is closed */}
      <AnimatePresence>
        {!isMobileMenuOpen && (
          <motion.div
            className='lg:hidden relative top-2 left-2 z-50'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              onClick={toggleMobileMenu}
              className='p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors'
              aria-label='Toggle navigation menu'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className='h-6 w-6 text-gray-700' />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className='lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40'
            onClick={toggleMobileMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        className='hidden lg:block w-64 xl:w-72 bg-gradient-to-b from-[#EFF1F7] to-[#E8ECF5] min-h-screen border-r border-[#D8DEF3] shadow-sm'
        initial={hasInitialized ? false : { opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: hasInitialized ? 0 : 0.4, ease: 'easeOut' }}
      >
        <SidebarContent />
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className='lg:hidden fixed top-0 left-0 z-40 w-80 max-w-[85vw] h-full 
              bg-gradient-to-b from-[#EFF1F7] to-[#E8ECF5] border-r border-[#D8DEF3] shadow-2xl'
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <SidebarContent showCloseButton={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccountSidebar;
