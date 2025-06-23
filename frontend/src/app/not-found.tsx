'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Home,
  Search,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  const router = useRouter();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4'>
      <motion.div
        className='w-full max-w-2xl'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <Card className='border-0 shadow-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg'>
          <CardContent className='p-8 md:p-12 text-center'>
            {/* Animated 404 Icon */}
            <motion.div
              className='relative mb-8'
              variants={floatingVariants}
              animate='animate'
            >
              <div className='relative'>
                <motion.div
                  className='text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400'
                  variants={pulseVariants}
                  animate='animate'
                >
                  404
                </motion.div>
                <motion.div
                  className='absolute -top-4 -right-4'
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <AlertTriangle className='h-8 w-8 text-amber-500' />
                </motion.div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div variants={itemVariants} className='space-y-4 mb-8'>
              <h1 className='text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100'>
                Oops! Page Not Found
              </h1>
              <p className='text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto'>
                The page you&apos;re looking for seems to have wandered off into
                the digital void.
              </p>
              <p className='text-sm text-slate-500 dark:text-slate-400'>
                Don&apos;t worry, it happens to the best of us!
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              variants={itemVariants}
              className='flex flex-col sm:flex-row gap-4 justify-center items-center'
            >
              <Button
                asChild
                size='lg'
                className='bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 group'
              >
                <Link href='/' className='flex items-center gap-2'>
                  <Home className='h-4 w-4 group-hover:scale-110 transition-transform' />
                  Go Home
                </Link>
              </Button>

              <Button
                variant='outline'
                size='lg'
                onClick={() => router.back()}
                className='border-slate-300 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-700 transition-all duration-300 group'
              >
                <ArrowLeft className='h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform' />
                Go Back
              </Button>

              <Button
                variant='ghost'
                size='lg'
                onClick={() => window.location.reload()}
                className='hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 group'
              >
                <RefreshCw className='h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500' />
                Refresh
              </Button>
            </motion.div>

            {/* Search Suggestion */}
            <motion.div
              variants={itemVariants}
              className='mt-8 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600'
            >
              <div className='flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300'>
                <Search className='h-4 w-4' />
                <span className='text-sm'>
                  Try searching for what you need or check the URL spelling
                </span>
              </div>
            </motion.div>

            {/* Decorative Elements */}
            <motion.div
              className='absolute top-4 left-4 opacity-20'
              animate={{
                rotate: [0, 180, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <div className='w-16 h-16 border-2 border-blue-300 rounded-full' />
            </motion.div>

            <motion.div
              className='absolute bottom-4 right-4 opacity-20'
              animate={{
                rotate: [360, 180, 0],
                scale: [1, 0.8, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <div className='w-12 h-12 border-2 border-purple-300 rounded-full' />
            </motion.div>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className='text-center mt-6 text-sm text-slate-500 dark:text-slate-400'
        >
          <p>
            Need help? Contact our{' '}
            <Link
              href='/support/contact'
              className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 hover:underline-offset-4 transition-all'
            >
              support team
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
