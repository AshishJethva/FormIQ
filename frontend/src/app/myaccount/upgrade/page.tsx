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

const USD_TO_INR_RATE = 85;

const UpgradePage = () => {
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
        const response = await paymentService.getPaymentHistory();
        setPaymentHistory(response.data.paymentHistory || []);
      } catch (error) {
        console.error('Failed to fetch payment history:', error);
      }
    };

    fetchPaymentHistory();
  }, []);

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

  // Get current plan type
  const currentPlan = userProfile?.profile.plan.type || 'STARTER';

  // Price data for each plan
  const bronzePriceData = getPriceData(3);
  const silverPriceData = getPriceData(7);
  const goldPriceData = getPriceData(11);

  return (
    <div className='bg-gray-50 min-h-screen w-full py-10 px-4'>
      <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden'>
        <div className='py-8 px-10 border-b border-gray-200 flex justify-between items-center'>
          <h1 className='text-2xl font-semibold text-navy-900'>
            Choose Your <span className='text-green-600'>Plan</span>
          </h1>
          <div className='flex items-center gap-3'>
            <Shield className='h-5 w-5 text-green-600' />
            <span className='text-sm text-gray-600'>
              Secure payments powered by Razorpay
            </span>
          </div>
        </div>

        <div className='p-10'>
          {/* Current Plan Info and Downgrade Option */}
          {currentPlan !== 'STARTER' && (
            <div className='mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-semibold text-blue-900'>
                    Current Plan: {currentPlan}
                  </h3>
                  <p className='text-sm text-blue-700'>
                    You can downgrade to the FREE Starter plan anytime
                  </p>
                </div>
                <div className='flex items-center gap-3'>
                  <button
                    onClick={() => {
                      const latestPayment = paymentHistory[0];
                      const paymentId =
                        latestPayment?.id || 'sample_payment_id';
                      downloadReceipt(paymentId);
                    }}
                    className='px-4 py-2 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors flex items-center gap-2 cursor-pointer'
                  >
                    <Download className='w-4 h-4' />
                    Download Receipt
                  </button>

                  <button
                    onClick={() => setShowDowngradeConfirm(true)}
                    disabled={isDowngrading}
                    className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer'
                  >
                    {isDowngrading ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        Downgrading...
                      </>
                    ) : (
                      <>
                        <ArrowDown className='w-4 h-4' />
                        Downgrade to FREE
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Toggle */}
          <div className='mb-8 flex justify-center'>
            <div className='bg-gray-100 rounded-full p-1 flex items-center'>
              <button
                className={`px-6 py-2 cursor-pointer rounded-full transition-all ${
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
                className={`px-6 py-2 cursor-pointer rounded-full transition-all ${
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
              <div className='ml-4 flex items-center text-blue-600'>
                <Zap className='h-4 w-4 mr-1' />
                <span className='text-sm font-medium'>Save 50%</span>
              </div>
            )}
          </div>

          {/* Pricing Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Starter Plan */}
            <div className='bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col'>
              <div className='p-6 bg-emerald-500 text-white text-center relative'>
                {currentPlan === 'STARTER' && (
                  <div className='absolute top-2 right-2'>
                    <CheckCircle className='h-5 w-5 text-white' />
                  </div>
                )}
                <h3 className='text-xl font-semibold mb-4'>Starter</h3>
                <div className='text-3xl font-bold'>FREE</div>
                <div className='text-sm mt-2'>Perfect for start</div>
              </div>
              <div className='p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                <div className='flex-grow'>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>5 Forms</div>
                    <div className='text-xs text-gray-400'>Form Limit</div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>100</div>
                    <div className='text-xs text-gray-400'>
                      Monthly Submissions
                    </div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>1 User</div>
                    <div className='text-xs text-gray-400'>per Team</div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>100 MB</div>
                    <div className='text-xs text-gray-400'>Storage</div>
                  </div>
                </div>
                <div className='mt-6'>
                  <button
                    className='w-full py-2 px-4 bg-gray-600 text-white rounded font-medium cursor-pointer'
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
            <div className='bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col'>
              <div className='p-6 bg-orange-500 text-white text-center relative'>
                {currentPlan === 'BRONZE' && (
                  <div className='absolute top-2 right-2'>
                    <CheckCircle className='h-5 w-5 text-white' />
                  </div>
                )}
                <h3 className='text-xl font-semibold mb-4'>Bronze</h3>
                <div className='flex items-center justify-center'>
                  {billingCycle === 'yearly' && (
                    <>
                      <span className='text-4xl font-bold'>
                        ₹{formatWithCommas(bronzePriceData.displayPrice)}
                      </span>
                      <span className='text-xs ml-1'>/month</span>
                    </>
                  )}
                  {billingCycle === 'monthly' && (
                    <>
                      <span className='text-4xl font-bold'>
                        ₹{formatWithCommas(bronzePriceData.displayPrice)}
                      </span>
                      <span className='text-xs ml-1'>/month</span>
                    </>
                  )}
                </div>
                <div className='text-sm mt-2 h-5'>
                  {billingCycle === 'yearly'
                    ? `Billed ₹${formatWithCommas(
                        bronzePriceData.annualBilling
                      )} annually`
                    : 'Billed monthly'}
                </div>
              </div>
              <div className='p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                <div className='flex-grow'>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>25 Forms</div>
                    <div className='text-xs text-gray-400'>Form Limit</div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>1,000</div>
                    <div className='text-xs text-gray-400'>
                      Monthly Submissions
                    </div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>1 User</div>
                    <div className='text-xs text-gray-400'>per Team</div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>1 GB</div>
                    <div className='text-xs text-gray-400'>Storage</div>
                  </div>
                </div>
                <div className='mt-6'>
                  <button
                    className={`w-full py-2 px-4 text-white rounded font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
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
                        <Loader2 className='w-4 h-4 animate-spin' />
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
            <div className='bg-white border rounded-lg overflow-hidden shadow-sm relative flex flex-col'>
              <div className='absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-bl-lg font-bold'>
                MOST POPULAR
              </div>
              <div className='p-6 bg-blue-500 text-white text-center relative'>
                {currentPlan === 'SILVER' && (
                  <div className='absolute top-2 left-2'>
                    <CheckCircle className='h-5 w-5 text-white' />
                  </div>
                )}
                <h3 className='text-xl font-semibold mb-4'>Silver</h3>
                <div className='flex items-center justify-center'>
                  {billingCycle === 'yearly' && (
                    <span className='text-sm line-through mr-2 opacity-75'>
                      ₹{formatWithCommas(silverPriceData.originalPrice)}
                    </span>
                  )}
                  <span className='text-4xl font-bold'>
                    ₹{formatWithCommas(silverPriceData.displayPrice)}
                  </span>
                  <span className='text-xs ml-1'>/month</span>
                </div>
                <div className='text-sm mt-2 h-5'>
                  {billingCycle === 'yearly'
                    ? `Billed ₹${formatWithCommas(
                        silverPriceData.annualBilling
                      )} annually`
                    : 'Billed monthly'}
                </div>
              </div>
              <div className='p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                <div className='flex-grow'>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>50 Forms</div>
                    <div className='text-xs text-gray-400'>Form Limit</div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>2,500</div>
                    <div className='text-xs text-gray-400'>
                      Monthly Submissions
                    </div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>1 User</div>
                    <div className='text-xs text-gray-400'>per Team</div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>10 GB</div>
                    <div className='text-xs text-gray-400'>Storage</div>
                  </div>
                </div>
                <div className='mt-6'>
                  <button
                    className={`w-full py-2 px-4 text-white rounded font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
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
                        <Loader2 className='w-4 h-4 animate-spin' />
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
            <div className='bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col'>
              <div className='p-6 bg-yellow-500 text-white text-center relative'>
                {currentPlan === 'GOLD' && (
                  <div className='absolute top-2 right-2'>
                    <CheckCircle className='h-5 w-5 text-white' />
                  </div>
                )}
                <h3 className='text-xl font-semibold mb-4'>Gold</h3>
                <div className='flex items-center justify-center'>
                  {billingCycle === 'yearly' && (
                    <span className='text-sm line-through mr-2 opacity-75'>
                      ₹{formatWithCommas(goldPriceData.originalPrice)}
                    </span>
                  )}
                  <span className='text-4xl font-bold'>
                    ₹{formatWithCommas(goldPriceData.displayPrice)}
                  </span>
                  <span className='text-xs ml-1'>/month</span>
                </div>
                <div className='text-sm mt-2 h-5'>
                  {billingCycle === 'yearly'
                    ? `Billed ₹${formatWithCommas(
                        goldPriceData.annualBilling
                      )} annually`
                    : 'Billed monthly'}
                </div>
              </div>
              <div className='p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                <div className='flex-grow'>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>100 Forms</div>
                    <div className='text-xs text-gray-400'>Form Limit</div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>10,000</div>
                    <div className='text-xs text-gray-400'>
                      Monthly Submissions
                    </div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>1 User</div>
                    <div className='text-xs text-gray-400'>per Team</div>
                  </div>
                  <div className='mt-6 text-center'>
                    <div className='text-lg font-semibold'>100 GB</div>
                    <div className='text-xs text-gray-400'>Storage</div>
                  </div>
                </div>
                <div className='mt-6'>
                  <button
                    className={`w-full py-2 px-4 text-white rounded font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
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
                        <Loader2 className='w-4 h-4 animate-spin' />
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
          <div className='mt-12 bg-gray-50 rounded-lg p-6'>
            <h3 className='text-lg font-semibold mb-4 text-center'>
              All Plans Include
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
              <div className='flex items-center'>
                <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                <span>Unlimited form fields</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                <span>Real-time notifications</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                <span>Data export (CSV, Excel)</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                <span>Mobile responsive forms</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                <span>Basic analytics</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                <span>SSL encryption</span>
              </div>
            </div>
          </div>

          {/* Payment Security */}
          <div className='mt-8 text-center'>
            <div className='flex items-center justify-center gap-4 text-sm text-gray-600'>
              <div className='flex items-center'>
                <Shield className='h-4 w-4 mr-1' />
                <span>256-bit SSL</span>
              </div>
              <div className='flex items-center'>
                <CheckCircle className='h-4 w-4 mr-1' />
                <span>PCI Compliant</span>
              </div>
              <div className='flex items-center'>
                <Zap className='h-4 w-4 mr-1' />
                <span>Instant Activation</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className='mt-8 text-xs text-gray-500 text-center'>
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
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold mb-4'>Confirm Downgrade</h3>
            <p className='text-gray-600 mb-6'>
              Are you sure you want to downgrade to the FREE Starter plan? You
              will lose access to premium features and your form limit will be
              reduced to 5 forms.
            </p>
            <div className='flex justify-end gap-3'>
              <button
                onClick={() => setShowDowngradeConfirm(false)}
                className='px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'
                disabled={isDowngrading}
              >
                Cancel
              </button>
              <button
                onClick={handleDowngrade}
                disabled={isDowngrading}
                className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center gap-2 cursor-pointer'
              >
                {isDowngrading ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
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
