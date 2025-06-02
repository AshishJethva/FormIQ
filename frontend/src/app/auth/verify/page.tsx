// 'use client';

// import type { StoreDispatch } from '@/redux/store';

// import React, {
//   useState,
//   useRef,
//   ChangeEvent,
//   KeyboardEvent,
//   ClipboardEvent,
// } from 'react';

// import { useDispatch, useSelector } from 'react-redux';
// import { useRouter } from 'next/navigation';
// import { RootState } from '@/redux/store';

// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { verifyOTP } from '@/redux/slices/auth/userSlice';
// import { Loader2 } from 'lucide-react';

// const OTPVerification: React.FC = () => {
//   const dispatch = useDispatch<StoreDispatch>();
//   const router = useRouter();
//   const isLoading = useSelector((state: RootState) => state.app.auth.isLoading);
//   const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);

//   const inputRefs = [
//     useRef<HTMLInputElement>(null),
//     useRef<HTMLInputElement>(null),
//     useRef<HTMLInputElement>(null),
//     useRef<HTMLInputElement>(null),
//     useRef<HTMLInputElement>(null),
//     useRef<HTMLInputElement>(null),
//   ];

//   const handleChange = (element: HTMLInputElement, index: number) => {
//     if (isNaN(Number(element.value))) return;

//     const newOtp = [...otp];

//     newOtp[index] = element.value;
//     setOtp(newOtp);

//     if (element.value && index < 5) {
//       inputRefs[index + 1].current?.focus();
//     }
//   };

//   const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
//     if (e.key === 'Backspace' && !otp[index] && index > 0) {
//       inputRefs[index - 1].current?.focus();
//     }
//   };

//   const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
//     e.preventDefault();
//     const pastedData = e.clipboardData.getData('text').slice(0, 6);

//     if (/^\d+$/.test(pastedData)) {
//       const newOtp = [...otp];

//       pastedData.split('').forEach((digit, index) => {
//         if (index < 6) {
//           newOtp[index] = digit;
//         }
//       });
//       setOtp(newOtp);

//       const lastIndex = Math.min(pastedData.length - 1, 5);

//       inputRefs[lastIndex].current?.focus();
//     }
//   };

//   const onSubmit = async () => {
//     const otpValue = otp.join('');
//     if (otpValue.length === 6) {
//       try {
//         const result = await dispatch(verifyOTP(otpValue));

//         if (result?.success) {
//           router.push('/dashboard');
//         }
//         // The error toast is already handled in the verifyOTP function
//       } catch (error) {
//         console.error('Verification error:', error);
//       }
//     }
//   };

//   return (
//     <div className='flex items-center justify-center min-h-screen p-4'>
//       <Card className='w-full max-w-md mx-auto'>
//         <CardHeader>
//           <CardTitle className='text-center'>Enter Verification Code</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className='flex flex-col items-center gap-6'>
//             <p className='text-sm text-gray-500'>
//               We have sent a verification code to your device
//             </p>

//             <div className='flex gap-2'>
//               {otp.map((digit, index) => (
//                 <input
//                   key={index}
//                   ref={inputRefs[index]}
//                   className='w-12 h-12 text-center text-xl border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
//                   maxLength={1}
//                   type='text'
//                   value={digit}
//                   onChange={(e: ChangeEvent<HTMLInputElement>) =>
//                     handleChange(e.target, index)
//                   }
//                   onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
//                     handleKeyDown(e, index)
//                   }
//                   onPaste={handlePaste}
//                 />
//               ))}
//             </div>

//             <Button
//               className='w-full'
//               disabled={otp.join('').length !== 6 || isLoading}
//               onClick={onSubmit}
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 className='mr-2 h-4 w-4 animate-spin' />
//                   Verifying...
//                 </>
//               ) : (
//                 'Verify'
//               )}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default OTPVerification;

'use client';

import type { StoreDispatch } from '@/redux/store';

import React, {
  useState,
  useRef,
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent,
  useEffect,
} from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyOTP } from '@/redux/slices/auth/userSlice';
import { Loader2, Mail, Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OTPVerification: React.FC = () => {
  const dispatch = useDispatch<StoreDispatch>();
  const router = useRouter();
  const isLoading = useSelector((state: RootState) => state.app.auth.isLoading);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 2 minutes
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-move to next input
    if (element.value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all fields are filled
    if (index === 5 && element.value) {
      const fullOtp = [...newOtp];
      fullOtp[5] = element.value;
      if (fullOtp.every(digit => digit !== '')) {
        setTimeout(() => onSubmit(fullOtp.join('')), 100);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);

    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      pastedData.split('').forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);

      const lastIndex = Math.min(pastedData.length - 1, 5);
      inputRefs[lastIndex].current?.focus();

      // Auto-submit if complete
      if (pastedData.length === 6) {
        setTimeout(() => onSubmit(pastedData), 100);
      }
    }
  };

  const onSubmit = async (otpValue?: string) => {
    const finalOtp = otpValue || otp.join('');
    if (finalOtp.length === 6) {
      try {
        const result = await dispatch(verifyOTP(finalOtp));
        if (result?.success) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Verification error:', error);
      }
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      // Add your resend OTP logic here

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setTimeLeft(120);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    router.push('/auth/login');
  };

  const isComplete = otp.every(digit => digit !== '');

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4'>
      {/* Background decorations */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl' />
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full opacity-10 blur-3xl' />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='w-full max-w-md mx-auto relative z-10'
      >
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleBack}
          className='flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors group'
        >
          <ArrowLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />
          <span className='text-sm font-medium'>Back</span>
        </motion.button>

        <Card className='border-0 shadow-2xl bg-white/80 backdrop-blur-lg'>
          <CardHeader className='text-center pb-6'>
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className='mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4'
            >
              <Shield className='w-8 h-8 text-white' />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CardTitle className='text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2'>
                Verify Your Identity
              </CardTitle>
              <p className='text-gray-600 text-sm leading-relaxed'>
                We&apos;ve sent a 6-digit verification code to your registered
                device.
                <br />
                Please enter it below to continue.
              </p>
            </motion.div>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* OTP Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className='flex justify-center gap-3'
            >
              {otp.map((digit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileFocus={{ scale: 1.05 }}
                >
                  <input
                    ref={inputRefs[index]}
                    className='w-12 h-14 text-center text-xl font-semibold border-2 rounded-xl transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none bg-gray-50 focus:bg-white hover:border-gray-400'
                    maxLength={1}
                    type='text'
                    value={digit}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleChange(e.target, index)
                    }
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                      handleKeyDown(e, index)
                    }
                    onPaste={handlePaste}
                    disabled={isLoading}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Timer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className='text-center'
            >
              <AnimatePresence mode='wait'>
                {!canResend ? (
                  <motion.div
                    key='timer'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className='flex items-center justify-center gap-2 text-sm text-gray-500'
                  >
                    <div className='w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin' />
                    Code expires in{' '}
                    <span className='font-mono font-semibold text-blue-600'>
                      {formatTime(timeLeft)}
                    </span>
                  </motion.div>
                ) : (
                  <motion.button
                    key='resend'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={handleResend}
                    disabled={isResending}
                    className='flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors group'
                  >
                    <RefreshCw
                      className={`w-4 h-4 transition-transform ${
                        isResending ? 'animate-spin' : 'group-hover:rotate-180'
                      }`}
                    />
                    {isResending ? 'Sending...' : `Didn't receive code: Resend`}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
                  isComplete && !isLoading
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!isComplete || isLoading}
                onClick={() => onSubmit()}
              >
                <AnimatePresence mode='wait'>
                  {isLoading ? (
                    <motion.div
                      key='loading'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className='flex items-center gap-2'
                    >
                      <Loader2 className='w-5 h-5 animate-spin' />
                      Verifying...
                    </motion.div>
                  ) : (
                    <motion.div
                      key='verify'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className='flex items-center gap-2'
                    >
                      <Shield className='w-5 h-5' />
                      Verify Code
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

            {/* Security note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className='bg-blue-50 border border-blue-100 rounded-lg p-4'
            >
              <div className='flex items-start gap-3'>
                <Mail className='w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0' />
                <div className='text-sm'>
                  <p className='text-blue-800 font-medium mb-1'>
                    Security Notice
                  </p>
                  <p className='text-blue-700 leading-relaxed'>
                    For your security, this code will expire automatically.
                    Never share this code with anyone.
                  </p>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OTPVerification;
