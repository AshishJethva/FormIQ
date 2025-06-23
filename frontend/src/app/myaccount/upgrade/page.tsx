// src/app/myaccount/upgrade/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Loader2,
  CheckCircle,
  Shield,
  Zap,
  ArrowDown,
  Download,
} from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { useSelector } from 'react-redux';
import { selectUserProfile } from '@/redux/slices/userProfile/userProfileSlice';
import { toast } from 'sonner';
import paymentService from '@/services/payment';
import UpgradePageSkeleton from '@/components/skeletons/UpgradePageSkeleton';

const USD_TO_INR_RATE = 85;
type Plan = 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD';

const UpgradePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    'yearly'
  );
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const {
    initiatePayment,
    downgradeToStarter,
    downloadReceipt,
    processingPlan,
    isDowngrading,
  } = usePayment();
  const userProfile = useSelector(selectUserProfile);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Adjust this based on your actual data loading time

    return () => clearTimeout(timer);
  }, []);

  // Show success message if redirected after upgrade
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      toast.success('🎉 Welcome to Premium!', {
        description:
          'Your plan has been upgraded successfully. Enjoy your new features!',
        duration: 5000,
      });
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        setIsLoading(true);
        const response = await paymentService.getPaymentHistory();
        setPaymentHistory(response.data.paymentHistory || []);
      } catch (error) {
        console.error('Failed to fetch payment history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have user profile
    if (userProfile) {
      fetchPaymentHistory();
    }
  }, [userProfile]);

  // Show skeleton while loading user profile or payment data
  if (isLoading || !userProfile) {
    return <UpgradePageSkeleton />;
  }

  // Handle upgrade button click
  const handleUpgrade = async (planName: string) => {
    const plan = planName.toUpperCase() as 'BRONZE' | 'SILVER' | 'GOLD';

    try {
      await initiatePayment({
        plan,
        billing: billingCycle,
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
    }
  };

  // Handle downgrade
  const handleDowngrade = async () => {
    try {
      await downgradeToStarter();
      setShowDowngradeConfirm(false);
    } catch (error: any) {
      console.error('Downgrade error:', error);
    }
  };

  // Convert USD to INR
  const toINR = (usdAmount: number): number => {
    return Math.round(usdAmount * USD_TO_INR_RATE);
  };

  // Calculate prices based on billing cycle
  const getPriceData = (monthlyPrice: number) => {
    const monthlyPriceINR = toINR(monthlyPrice);

    if (billingCycle === 'yearly') {
      const discountedMonthlyPriceINR = Math.round(monthlyPriceINR * 0.5);
      const annualPriceINR = discountedMonthlyPriceINR * 12;

      return {
        displayPrice: discountedMonthlyPriceINR,
        originalPrice: monthlyPriceINR,
        annualBilling: annualPriceINR,
      };
    }

    return {
      displayPrice: monthlyPriceINR,
      originalPrice: monthlyPriceINR,
      annualBilling: monthlyPriceINR * 12,
    };
  };

  // Format number with commas for thousands
  const formatWithCommas = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Get current plan type - FIXED: Apply the Plan type
  const currentPlan: Plan =
    (userProfile?.profile?.plan?.type as Plan) || 'STARTER';

  // Price data for each plan
  const bronzePriceData = getPriceData(3);
  const silverPriceData = getPriceData(7);
  const goldPriceData = getPriceData(11);

  return (
    <div className='bg-gray-50 min-h-screen w-full py-4 sm:py-6 lg:py-10 px-2 sm:px-4'>
      <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm '>
        <div className='py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-10 border-b border-gray-200'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <h1 className='text-xl sm:text-2xl font-semibold text-navy-900'>
              Choose Your <span className='text-green-600'>Plan</span>
            </h1>
            <div className='flex items-center gap-2 sm:gap-3'>
              <Shield className='h-4 w-4 sm:h-5 sm:w-5 text-green-600' />
              <span className='text-xs sm:text-sm text-gray-600'>
                Secure payments powered by Razorpay
              </span>
            </div>
          </div>
        </div>

        <div className=' p-4 sm:p-6 lg:p-10'>
          {/* Current Plan Info and Downgrade Option */}
          {currentPlan !== 'STARTER' && (
            <div className='mb-6 sm:mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4'>
                <div>
                  <h3 className='text-base sm:text-lg font-semibold text-blue-900'>
                    Current Plan: {currentPlan}
                  </h3>
                  <p className='text-xs sm:text-sm text-blue-700 mt-1'>
                    You can downgrade to the FREE Starter plan anytime
                  </p>
                </div>
                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto'>
                  <button
                    onClick={() => {
                      const latestPayment = paymentHistory[0];
                      const paymentId =
                        latestPayment?.id || 'sample_payment_id';
                      downloadReceipt(paymentId);
                    }}
                    className='px-3 sm:px-4 py-2 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm'
                  >
                    <Download className='w-3 h-3 sm:w-4 sm:h-4' />
                    <span className='hidden sm:inline'>Download Receipt</span>
                    <span className='sm:hidden'>Receipt</span>
                  </button>

                  <button
                    onClick={() => setShowDowngradeConfirm(true)}
                    disabled={isDowngrading}
                    className='px-3 sm:px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm'
                  >
                    {isDowngrading ? (
                      <>
                        <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 animate-spin' />
                        <span className='hidden sm:inline'>Downgrading...</span>
                        <span className='sm:hidden'>...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDown className='w-3 h-3 sm:w-4 sm:h-4' />
                        <span className='hidden sm:inline'>
                          Downgrade to FREE
                        </span>
                        <span className='sm:hidden'>Downgrade</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Toggle */}
          <div className='mb-6 sm:mb-8 flex flex-col sm:flex-row justify-center items-center gap-4'>
            <div className='bg-gray-100 rounded-full p-1 flex items-center'>
              <button
                className={`px-4 sm:px-6 py-2 cursor-pointer rounded-full transition-all text-sm sm:text-base ${
                  billingCycle === 'monthly'
                    ? 'bg-white shadow-sm'
                    : 'text-gray-600'
                }`}
                onClick={() => setBillingCycle('monthly')}
                disabled={!!processingPlan}
              >
                Monthly
              </button>
              <button
                className={`px-4 sm:px-6 py-2 cursor-pointer rounded-full transition-all text-sm sm:text-base ${
                  billingCycle === 'yearly'
                    ? 'bg-white shadow-sm'
                    : 'text-gray-600'
                }`}
                onClick={() => setBillingCycle('yearly')}
                disabled={!!processingPlan}
              >
                Yearly
              </button>
            </div>

            {billingCycle === 'yearly' && (
              <div className='flex items-center text-blue-600'>
                <Zap className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                <span className='text-xs sm:text-sm font-medium'>Save 50%</span>
              </div>
            )}
          </div>

          {/* Pricing Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5'>
            {/* Starter Plan */}
            <div
              className={`bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col transition-all duration-300 ${
                currentPlan === 'STARTER'
                  ? 'ring-2 ring-emerald-500 ring-offset-2 transform scale-105 z-10'
                  : 'opacity-40 hover:opacity-70'
              }`}
            >
              <div className='p-4 sm:p-6 bg-emerald-500 text-white text-center relative'>
                {currentPlan === 'STARTER' && (
                  <div className='absolute top-2 right-2'>
                    <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-white' />
                  </div>
                )}
                <h3 className='text-lg sm:text-xl font-semibold mb-2 sm:mb-4'>
                  Starter
                </h3>
                <div className='text-2xl sm:text-3xl font-bold'>FREE</div>
                <div className='text-xs sm:text-sm mt-2'>Perfect for start</div>
              </div>
              <div className='p-3 sm:p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                <div className='flex-grow space-y-4 sm:space-y-6'>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      5 Forms
                    </div>
                    <div className='text-xs text-gray-400'>Form Limit</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      100
                    </div>
                    <div className='text-xs text-gray-400'>
                      Monthly Submissions
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      1 User
                    </div>
                    <div className='text-xs text-gray-400'>per Team</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      100 MB
                    </div>
                    <div className='text-xs text-gray-400'>Storage</div>
                  </div>
                </div>
                <div className='mt-4 sm:mt-6'>
                  <button
                    className='w-full py-2 px-4 bg-gray-600 text-white rounded font-medium cursor-pointer text-sm'
                    disabled
                  >
                    {currentPlan === 'STARTER'
                      ? 'Current Plan'
                      : 'Free Forever'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bronze Plan */}
            <div
              className={`bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col transition-all duration-300 ${
                currentPlan === 'BRONZE'
                  ? 'ring-2 ring-orange-500 ring-offset-2 transform scale-105 z-10'
                  : 'opacity-40 hover:opacity-70'
              }`}
            >
              <div className='p-4 sm:p-6 bg-orange-500 text-white text-center relative'>
                {currentPlan === 'BRONZE' && (
                  <div className='absolute top-2 right-2'>
                    <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-white' />
                  </div>
                )}
                <h3 className='text-lg sm:text-xl font-semibold mb-2 sm:mb-4'>
                  Bronze
                </h3>
                <div className='flex items-center justify-center'>
                  <span className='text-2xl sm:text-4xl font-bold'>
                    ₹{formatWithCommas(bronzePriceData.displayPrice)}
                  </span>
                  <span className='text-xs ml-1'>/month</span>
                </div>
                <div className='text-xs sm:text-sm mt-2 h-5'>
                  {billingCycle === 'yearly'
                    ? `Billed ₹${formatWithCommas(
                        bronzePriceData.annualBilling
                      )} annually`
                    : 'Billed monthly'}
                </div>
              </div>
              <div className='p-3 sm:p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                <div className='flex-grow space-y-4 sm:space-y-6'>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      25 Forms
                    </div>
                    <div className='text-xs text-gray-400'>Form Limit</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      1,000
                    </div>
                    <div className='text-xs text-gray-400'>
                      Monthly Submissions
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      1 User
                    </div>
                    <div className='text-xs text-gray-400'>per Team</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      1 GB
                    </div>
                    <div className='text-xs text-gray-400'>Storage</div>
                  </div>
                </div>
                <div className='mt-4 sm:mt-6'>
                  <button
                    className={`w-full py-2 px-4 text-white rounded font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm ${
                      processingPlan === 'BRONZE' || currentPlan === 'BRONZE'
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                    }`}
                    onClick={() => handleUpgrade('Bronze')}
                    disabled={
                      processingPlan === 'BRONZE' || currentPlan === 'BRONZE'
                    }
                  >
                    {processingPlan === 'BRONZE' ? (
                      <>
                        <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 animate-spin' />
                        Processing...
                      </>
                    ) : currentPlan === 'BRONZE' ? (
                      'Current Plan'
                    ) : (
                      'Upgrade Now'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Silver Plan */}
            <div
              className={`bg-white border rounded-lg overflow-hidden shadow-sm relative flex flex-col transition-all duration-300 ${
                currentPlan === 'SILVER'
                  ? 'ring-2 ring-blue-500 ring-offset-2 transform scale-105 z-10'
                  : 'opacity-40 hover:opacity-70'
              }`}
            >
              <div className='absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 sm:px-3 py-1 rounded-bl-lg font-bold'>
                <span className='hidden sm:inline'>MOST POPULAR</span>
                <span className='sm:hidden'>POPULAR</span>
              </div>
              <div className='p-4 sm:p-6 bg-blue-500 text-white text-center relative'>
                {currentPlan === 'SILVER' && (
                  <div className='absolute top-2 left-2'>
                    <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-white' />
                  </div>
                )}
                <h3 className='text-lg sm:text-xl font-semibold mb-2 sm:mb-4'>
                  Silver
                </h3>
                <div className='flex items-center justify-center'>
                  {billingCycle === 'yearly' && (
                    <span className='text-xs sm:text-sm line-through mr-2 opacity-75'>
                      ₹{formatWithCommas(silverPriceData.originalPrice)}
                    </span>
                  )}
                  <span className='text-2xl sm:text-4xl font-bold'>
                    ₹{formatWithCommas(silverPriceData.displayPrice)}
                  </span>
                  <span className='text-xs ml-1'>/month</span>
                </div>
                <div className='text-xs sm:text-sm mt-2 h-5'>
                  {billingCycle === 'yearly'
                    ? `Billed ₹${formatWithCommas(
                        silverPriceData.annualBilling
                      )} annually`
                    : 'Billed monthly'}
                </div>
              </div>
              <div className='p-3 sm:p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                <div className='flex-grow space-y-4 sm:space-y-6'>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      50 Forms
                    </div>
                    <div className='text-xs text-gray-400'>Form Limit</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      2,500
                    </div>
                    <div className='text-xs text-gray-400'>
                      Monthly Submissions
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      1 User
                    </div>
                    <div className='text-xs text-gray-400'>per Team</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      10 GB
                    </div>
                    <div className='text-xs text-gray-400'>Storage</div>
                  </div>
                </div>
                <div className='mt-4 sm:mt-6'>
                  <button
                    className={`w-full py-2 px-4 text-white rounded font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm ${
                      processingPlan === 'SILVER' || currentPlan === 'SILVER'
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                    }`}
                    onClick={() => handleUpgrade('Silver')}
                    disabled={
                      processingPlan === 'SILVER' || currentPlan === 'SILVER'
                    }
                  >
                    {processingPlan === 'SILVER' ? (
                      <>
                        <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 animate-spin' />
                        Processing...
                      </>
                    ) : currentPlan === 'SILVER' ? (
                      'Current Plan'
                    ) : (
                      'Upgrade Now'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Gold Plan */}
            <div
              className={`bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col transition-all duration-300 ${
                currentPlan === 'GOLD'
                  ? 'ring-2 ring-yellow-500 ring-offset-2 transform scale-105 z-10'
                  : 'opacity-40 hover:opacity-70'
              }`}
            >
              <div className='p-4 sm:p-6 bg-yellow-500 text-white text-center relative'>
                {currentPlan === 'GOLD' && (
                  <div className='absolute top-2 right-2'>
                    <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-white' />
                  </div>
                )}
                <h3 className='text-lg sm:text-xl font-semibold mb-2 sm:mb-4'>
                  Gold
                </h3>
                <div className='flex items-center justify-center'>
                  {billingCycle === 'yearly' && (
                    <span className='text-xs sm:text-sm line-through mr-2 opacity-75'>
                      ₹{formatWithCommas(goldPriceData.originalPrice)}
                    </span>
                  )}
                  <span className='text-2xl sm:text-4xl font-bold'>
                    ₹{formatWithCommas(goldPriceData.displayPrice)}
                  </span>
                  <span className='text-xs ml-1'>/month</span>
                </div>
                <div className='text-xs sm:text-sm mt-2 h-5'>
                  {billingCycle === 'yearly'
                    ? `Billed ₹${formatWithCommas(
                        goldPriceData.annualBilling
                      )} annually`
                    : 'Billed monthly'}
                </div>
              </div>
              <div className='p-3 sm:p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                <div className='flex-grow space-y-4 sm:space-y-6'>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      100 Forms
                    </div>
                    <div className='text-xs text-gray-400'>Form Limit</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      10,000
                    </div>
                    <div className='text-xs text-gray-400'>
                      Monthly Submissions
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      1 User
                    </div>
                    <div className='text-xs text-gray-400'>per Team</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-base sm:text-lg font-semibold'>
                      100 GB
                    </div>
                    <div className='text-xs text-gray-400'>Storage</div>
                  </div>
                </div>
                <div className='mt-4 sm:mt-6'>
                  <button
                    className={`w-full py-2 px-4 text-white rounded font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm ${
                      processingPlan === 'GOLD' || currentPlan === 'GOLD'
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-yellow-500 hover:bg-yellow-600 cursor-pointer'
                    }`}
                    onClick={() => handleUpgrade('Gold')}
                    disabled={
                      processingPlan === 'GOLD' || currentPlan === 'GOLD'
                    }
                  >
                    {processingPlan === 'GOLD' ? (
                      <>
                        <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 animate-spin' />
                        Processing...
                      </>
                    ) : currentPlan === 'GOLD' ? (
                      'Current Plan'
                    ) : (
                      'Upgrade Now'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Comparison */}
          <div className='mt-8 sm:mt-12 bg-gray-50 rounded-lg p-4 sm:p-6'>
            <h3 className='text-base sm:text-lg font-semibold mb-4 text-center'>
              All Plans Include
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm'>
              <div className='flex items-center'>
                <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0' />
                <span>Unlimited form fields</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0' />
                <span>Real-time notifications</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0' />
                <span>Data export (CSV, Excel)</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0' />
                <span>Mobile responsive forms</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0' />
                <span>Basic analytics</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0' />
                <span>SSL encryption</span>
              </div>
            </div>
          </div>

          {/* Payment Security */}
          <div className='mt-6 sm:mt-8 text-center'>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600'>
              <div className='flex items-center'>
                <Shield className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                <span>256-bit SSL</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                <span>PCI Compliant</span>
              </div>
              <div className='flex items-center'>
                <Zap className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                <span>Instant Activation</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className='mt-6 sm:mt-8 text-xs text-gray-500 text-center px-2'>
            <p>
              *Prices shown are in Indian Rupees (INR). The 50% yearly discount
              is applied automatically. Plans auto-renew unless cancelled.
              30-day money-back guarantee on all paid plans. Test cards: Success
              (4111 1111 1111 1111), Failure (4111 1111 1111 1112).
            </p>
          </div>
        </div>
      </div>

      {/* Downgrade Confirmation Modal */}
      {showDowngradeConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4'>
            <h3 className='text-base sm:text-lg font-semibold mb-4'>
              Confirm Downgrade
            </h3>
            <p className='text-gray-600 mb-6 text-sm sm:text-base'>
              Are you sure you want to downgrade to the FREE Starter plan? You
              will lose access to premium features and your form limit will be
              reduced to 5 forms.
            </p>
            <div className='flex flex-col sm:flex-row justify-end gap-3'>
              <button
                onClick={() => setShowDowngradeConfirm(false)}
                className='px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer text-sm order-2 sm:order-1'
                disabled={isDowngrading}
              >
                Cancel
              </button>
              <button
                onClick={handleDowngrade}
                disabled={isDowngrading}
                className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm order-1 sm:order-2'
              >
                {isDowngrading ? (
                  <>
                    <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 animate-spin' />
                    Downgrading...
                  </>
                ) : (
                  'Yes, Downgrade'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpgradePage;
