// src/components/ErrorPage.tsx

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Home,
  Zap,
  CloudOff,
  Bug,
  Shield,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const errorTypes = {
  network: {
    icon: CloudOff,
    title: 'Network Connection Error',
    description:
      'Unable to connect to our servers. Please check your internet connection.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    gradient: 'from-blue-500 to-cyan-500',
  },
  server: {
    icon: Zap,
    title: 'Server Error',
    description: 'Something went wrong on our end. Our team has been notified.',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    gradient: 'from-red-500 to-pink-500',
  },
  security: {
    icon: Shield,
    title: 'Security Error',
    description:
      "Access denied. You don't have permission to view this resource.",
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    gradient: 'from-orange-500 to-red-500',
  },
  generic: {
    icon: Bug,
    title: 'Oops! Something went wrong',
    description:
      'An unexpected error occurred. Please try again or contact support.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    gradient: 'from-purple-500 to-pink-500',
  },
};

const getErrorType = (error: Error) => {
  const message = error.message.toLowerCase();
  if (message.includes('network') || message.includes('fetch'))
    return 'network';
  if (message.includes('server') || message.includes('500')) return 'server';
  if (message.includes('unauthorized') || message.includes('403'))
    return 'security';
  return 'generic';
};

// Enhanced floating particles with brand colors
const FloatingParticles = () => {
  return (
    <div className='absolute inset-0 overflow-hidden pointer-events-none'>
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 rounded-full ${
            i % 3 === 0
              ? 'bg-blue-400'
              : i % 3 === 1
              ? 'bg-purple-400'
              : 'bg-pink-400'
          } opacity-20`}
          animate={{
            x: [0, Math.random() * 200 - 100],
            y: [0, Math.random() * 200 - 100],
            scale: [0, 1, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
};

// Glitch effect for error text
const GlitchText = ({ children }: { children: React.ReactNode }) => {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className='relative'
      animate={
        isGlitching
          ? {
              x: [0, -3, 3, -2, 2, 0],
              filter: [
                'hue-rotate(0deg)',
                'hue-rotate(90deg)',
                'hue-rotate(0deg)',
              ],
            }
          : {}
      }
      transition={{ duration: 0.3 }}
    >
      {children}
      {isGlitching && (
        <>
          <motion.div
            className='absolute inset-0 text-red-400 opacity-70'
            style={{ transform: 'translate(-2px, -1px)' }}
          >
            {children}
          </motion.div>
          <motion.div
            className='absolute inset-0 text-blue-400 opacity-70'
            style={{ transform: 'translate(2px, 1px)' }}
          >
            {children}
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

// Animated counter for error ID
const AnimatedCounter = ({ end }: { end: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev < end) {
          return Math.min(prev + Math.ceil((end - prev) * 0.1), end);
        }
        return end;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [end]);

  return <span>{count.toString().padStart(4, '0')}</span>;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const errorType = getErrorType(error);
  const errorConfig = errorTypes[errorType];
  const IconComponent = errorConfig.icon;

  const handleRetry = async () => {
    setIsRetrying(true);
    // Add a smooth loading animation
    await new Promise(resolve => setTimeout(resolve, 1500));
    reset();
    setIsRetrying(false);
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden'>
      {/* Brand consistent background pattern */}
      <div className='absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]'></div>

      {/* Floating particles */}
      <FloatingParticles />

      {/* Main error container */}
      <AnimatePresence mode='wait'>
        <motion.div
          initial='initial'
          animate='animate'
          variants={stagger}
          className='relative z-10 w-full max-w-4xl'
        >
          {/* Error Card */}
          <motion.div variants={fadeInUp}>
            <Card className='bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden'>
              <CardContent className='p-0'>
                {/* Header section */}
                <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white relative overflow-hidden'>
                  {/* Brand logo */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className='flex items-center gap-3 mb-6'
                  >
                    <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center'>
                      <Image
                        src='/LOGO.png'
                        alt='FormIQ Logo'
                        width={32}
                        height={32}
                        className='filter brightness-0 invert'
                      />
                    </div>
                    <span className='text-2xl font-bold'>FormIQ</span>
                  </motion.div>

                  {/* Error icon and type */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className='flex items-center gap-4 mb-4'
                  >
                    <div className='w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center relative'>
                      <IconComponent className='w-8 h-8 text-white' />
                      {/* Pulse ring */}
                      <motion.div
                        className='absolute inset-0 rounded-2xl border-2 border-white/30'
                        animate={{
                          scale: [1, 1.3],
                          opacity: [0.7, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeOut',
                        }}
                      />
                    </div>
                    <div>
                      <h2 className='text-xl font-semibold text-white/90'>
                        Error Detected
                      </h2>
                      <p className='text-white/70'>
                        Error ID: #
                        <AnimatedCounter
                          end={
                            error.digest
                              ? parseInt(error.digest.slice(-4)) || 1234
                              : 1234
                          }
                        />
                      </p>
                    </div>
                  </motion.div>

                  {/* Decorative elements */}
                  <div className='absolute top-4 right-4 flex gap-2'>
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className='w-2 h-2 bg-white/30 rounded-full'
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Content section */}
                <div className='p-8 md:p-12'>
                  {/* Error message */}
                  <motion.div variants={fadeInUp} className='text-center mb-8'>
                    <GlitchText>
                      <h1 className='text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'>
                        {errorConfig.title}
                      </h1>
                    </GlitchText>
                    <p className='text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed'>
                      {errorConfig.description}
                    </p>
                  </motion.div>

                  {/* Action buttons */}
                  <motion.div
                    variants={fadeInUp}
                    className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-8'
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]'
                      >
                        {isRetrying ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className='flex items-center gap-2'
                          >
                            <RefreshCw className='w-5 h-5' />
                            Retrying...
                          </motion.div>
                        ) : (
                          <div className='flex items-center gap-2'>
                            <RefreshCw className='w-5 h-5' />
                            Try Again
                          </div>
                        )}
                      </Button>
                    </motion.div>

                    <div className='flex gap-3'>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={handleGoBack}
                          variant='outline'
                          className='border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-4 rounded-2xl transition-all font-semibold'
                        >
                          <ArrowLeft className='w-5 h-5 mr-2' />
                          Go Back
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={handleGoHome}
                          variant='outline'
                          className='border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-4 rounded-2xl transition-all font-semibold'
                        >
                          <Home className='w-5 h-5 mr-2' />
                          Home
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Error details for development */}
                  {process.env.NODE_ENV === 'development' && (
                    <motion.div
                      variants={fadeInUp}
                      className='max-w-2xl mx-auto'
                    >
                      <Button
                        onClick={() => setShowDetails(!showDetails)}
                        variant='ghost'
                        className='w-full text-sm text-gray-500 hover:text-gray-700 mb-4'
                      >
                        <AlertTriangle className='w-4 h-4 mr-2' />
                        {showDetails ? 'Hide' : 'Show'} Developer Details
                      </Button>

                      <AnimatePresence>
                        {showDetails && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className='bg-red-50 border border-red-200 rounded-2xl p-6 overflow-hidden'
                          >
                            <h4 className='font-semibold text-red-800 mb-3 flex items-center gap-2'>
                              <Bug className='w-4 h-4' />
                              Error Details
                            </h4>
                            <pre className='text-sm text-red-700 whitespace-pre-wrap break-words bg-white rounded-lg p-4 border border-red-200'>
                              {error.message}
                              {error.stack &&
                                '\n\nStack Trace:\n' + error.stack}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* Help section */}
                  <motion.div
                    variants={fadeInUp}
                    className='text-center mt-12 pt-8 border-t border-gray-200'
                  >
                    <div className='flex items-center justify-center gap-2 mb-4'>
                      <Sparkles className='w-5 h-5 text-blue-500' />
                      <span className='text-lg font-semibold text-gray-800'>
                        Need Help?
                      </span>
                    </div>
                    <p className='text-gray-600 mb-6'>
                      If the problem persists, our support team is here to help
                      you 24/7
                    </p>

                    <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant='outline'
                          className='border-blue-200 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold'
                        >
                          Contact Support
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant='outline'
                          className='border-purple-200 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-xl font-semibold'
                        >
                          View Documentation
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trust indicators */}
          <motion.div variants={fadeInUp} className='mt-8 text-center'>
            <div className='flex items-center justify-center gap-6 text-sm text-gray-500'>
              <div className='flex items-center gap-2'>
                <Shield className='w-4 h-4 text-green-500' />
                <span>SSL Secured</span>
              </div>
              <div className='flex items-center gap-2'>
                <Star className='w-4 h-4 text-yellow-500' />
                <span>99.9% Uptime</span>
              </div>
              <div className='flex items-center gap-2'>
                <Sparkles className='w-4 h-4 text-blue-500' />
                <span>24/7 Support</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
