'use client';

import type { StoreDispatch } from '@/redux/store';

import React, {
  useState,
  useRef,
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent,
} from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifyOTP } from '@/redux/slice/userSlice';
import { Loader2 } from 'lucide-react';

const OTPVerification: React.FC = () => {
  const dispatch = useDispatch<StoreDispatch>();
  const router = useRouter();
  const isLoading = useSelector((state: RootState) => state.app.auth.isLoading);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];

    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value && index < 5) {
      inputRefs[index + 1].current?.focus();
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
    }
  };

  const onSubmit = async () => {
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      try {
        const result = await dispatch(verifyOTP(otpValue));

        if (result?.success) {
          router.push('/dashboard');
        }
        // The error toast is already handled in the verifyOTP function
      } catch (error) {
        console.error('Verification error:', error);
      }
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen p-4'>
      <Card className='w-full max-w-md mx-auto'>
        <CardHeader>
          <CardTitle className='text-center'>Enter Verification Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center gap-6'>
            <p className='text-sm text-gray-500'>
              We have sent a verification code to your device
            </p>

            <div className='flex gap-2'>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  className='w-12 h-12 text-center text-xl border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
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
                />
              ))}
            </div>

            <Button
              className='w-full'
              disabled={otp.join('').length !== 6 || isLoading}
              onClick={onSubmit}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPVerification;
