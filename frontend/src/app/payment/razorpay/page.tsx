'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

const PaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { initiatePayment } = usePayment();
  const [paymentStatus, setPaymentStatus] = useState<
    'processing' | 'success' | 'failed' | null
  >(null);

  const plan = searchParams.get('plan') as 'BRONZE' | 'SILVER' | 'GOLD';
  const billing = searchParams.get('billing') as 'monthly' | 'yearly';

  useEffect(() => {
    if (!plan || !billing) {
      router.push('/myaccount/upgrade');
      return;
    }

    const processPayment = async () => {
      setPaymentStatus('processing');
      try {
        await initiatePayment({ plan, billing });
        setPaymentStatus('success');
      } catch {
        setPaymentStatus('failed');
      }
    };

    processPayment();
  }, [plan, billing, initiatePayment, router]);

  const handleRetry = () => {
    setPaymentStatus(null);
    router.push('/myaccount/upgrade');
  };

  const handleGoToAccount = () => {
    router.push('/myaccount');
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-md p-8'>
        {paymentStatus === 'processing' && (
          <div className='text-center'>
            <Loader2 className='w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin' />
            <h2 className='text-xl font-semibold mb-2'>Processing Payment</h2>
            <p className='text-gray-600'>
              Please wait while we process your {plan} plan upgrade...
            </p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className='text-center'>
            <CheckCircle className='w-16 h-16 mx-auto mb-4 text-green-600' />
            <h2 className='text-xl font-semibold mb-2 text-green-800'>
              Payment Successful!
            </h2>
            <p className='text-gray-600 mb-6'>
              Your {plan} plan has been activated successfully.
            </p>
            <button
              onClick={handleGoToAccount}
              className='w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors cursor-pointer'
            >
              Go to My Account
            </button>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className='text-center'>
            <XCircle className='w-16 h-16 mx-auto mb-4 text-red-600' />
            <h2 className='text-xl font-semibold mb-2 text-red-800'>
              Payment Failed
            </h2>
            <p className='text-gray-600 mb-6'>
              There was an issue processing your payment. Please try again.
            </p>
            <div className='space-y-3'>
              <button
                onClick={handleRetry}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors cursor-pointer'
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/myaccount')}
                className='w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors cursor-pointer'
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
