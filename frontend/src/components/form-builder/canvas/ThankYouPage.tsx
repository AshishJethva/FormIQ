'use client';

import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { CheckCircle, Heart, Sparkles } from 'lucide-react';

export default function ThankYouPage() {
  const form = useSelector((state: RootState) => state.formBuilder.form);

  if (!form) return null;

  return (
    <motion.div
      className='bg-gradient-to-br from-white to-gray-50/50 rounded-xl shadow-lg mb-6 min-h-[16rem] sm:min-h-[12rem] py-12 sm:py-10 mx-2 sm:mx-0 border border-gray-100'
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: 0.1,
      }}
    >
      <div className='text-center px-6 sm:px-8'>
        {/* Success Icon */}
        <motion.div
          className='flex justify-center mb-6'
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
            delay: 0.3,
          }}
        >
          <div className='relative'>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <CheckCircle className='w-16 h-16 sm:w-20 sm:h-20 text-green-500' />
            </motion.div>

            {/* Floating sparkles */}
            <motion.div
              className='absolute -top-2 -right-2'
              animate={{
                y: [-5, -10, -5],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Sparkles className='w-5 h-5 text-yellow-400' />
            </motion.div>

            <motion.div
              className='absolute -bottom-1 -left-1'
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            >
              <Heart className='w-4 h-4 text-red-400' />
            </motion.div>
          </div>
        </motion.div>

        {/* Thank you message */}
        <motion.h1
          className='text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {form.settings?.thankyouMessage || 'Thank you for your submission!'}
        </motion.h1>

        <motion.p
          className='text-gray-600 mb-8 text-base sm:text-lg leading-relaxed max-w-md mx-auto'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          Your form has been submitted successfully. We appreciate you taking
          the time to share your information with us.
        </motion.p>

        {/* Decorative elements */}
        <motion.div
          className='flex justify-center space-x-2 opacity-30'
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1, duration: 1 }}
        >
          {[...Array(3)].map((_, index) => (
            <motion.div
              key={index}
              className='w-2 h-2 bg-blue-400 rounded-full'
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
