// src/app/myaccount/upgrade/page.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';

const USD_TO_INR_RATE = 85;

const UpgradePage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    'yearly'
  );
  const router = useRouter();
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Handle upgrade button click
  const handleUpgrade = (planName: string) => {
    // In a real app, you might want to store the selected plan in state/context
    // Then redirect to Razorpay checkout
    showNotification(`Upgrading to ${planName} plan...`, 'success');
    router.push(
      `/payment/razorpay?plan=${planName.toLowerCase()}&billing=${billingCycle}`
    );
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

  // Show notification message
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({
      show: true,
      message,
      type,
    });

    // Auto hide notification after 3 seconds
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: 'success',
      });
    }, 3000);
  };

  // Price data for each plan
  const bronzePriceData = getPriceData(3);
  const silverPriceData = getPriceData(7);
  const goldPriceData = getPriceData(11);

  return (
    <div className='bg-gray-50 min-h-screen w-full py-10 px-4'>
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg z-50 flex items-center ${
            notification.type === 'success'
              ? 'bg-green-50 border-l-4 border-green-500 text-green-700'
              : 'bg-red-50 border-l-4 border-red-500 text-red-700'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className='h-5 w-5 mr-2' />
          ) : (
            <X className='h-5 w-5 mr-2' />
          )}
          <p className='text-sm'>{notification.message}</p>
          <button
            onClick={() =>
              setNotification({ show: false, message: '', type: 'success' })
            }
            className='ml-4 text-gray-500 hover:text-gray-700 cursor-pointer'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      )}

      <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden'>
        <div className='py-8 px-10 border-b border-gray-200 flex justify-between items-center'>
          <h1 className='text-2xl font-semibold text-navy-900'>
            Choose Your <span className='text-green-600'>Plan</span>
          </h1>
        </div>

        <div className='p-10'>
          {/* Billing Toggle */}
          <div className='mb-8 flex justify-center'>
            <div className='bg-gray-100 rounded-full p-1 flex items-center'>
              <button
                className={`px-6 py-2 cursor-pointer rounded-full ${
                  billingCycle === 'monthly'
                    ? 'bg-white shadow-sm'
                    : 'text-gray-600'
                }`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-6 py-2 cursor-pointer rounded-full ${
                  billingCycle === 'yearly'
                    ? 'bg-white shadow-sm'
                    : 'text-gray-600'
                }`}
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly
              </button>
            </div>

            {billingCycle === 'yearly' && (
              <div className='ml-4 flex items-center text-blue-600'>
                <span className='text-sm font-medium'>Save 50%</span>
                <div className='transform -rotate-90 ml-1'>
                  <div className='h-6 w-6 text-blue-500'>⤶</div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Starter Plan */}
            <div className='bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col'>
              <div className='p-6 bg-emerald-500 text-white text-center'>
                <h3 className='text-xl font-semibold mb-4'>Starter</h3>
                <div className='text-3xl font-bold'>FREE</div>
                <div className='text-sm mt-2'>* All Features Included</div>
              </div>
              <div className='p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                {/* Content area with flex-grow to push the button to bottom */}
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
                    <div className='text-xs text-gray-400'>Available Space</div>
                  </div>
                </div>

                {/* Button container with mt-auto to push to bottom */}
                <div className='mt-6'>
                  <button className='w-full py-2 px-4 bg-gray-600 text-white rounded font-medium cursor-pointer'>
                    Current
                  </button>
                </div>
              </div>
            </div>

            {/* Bronze Plan */}
            <div className='bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col'>
              <div className='p-6 bg-orange-500 text-white text-center'>
                <h3 className='text-xl font-semibold mb-4'>Bronze</h3>
                <div className='flex items-center justify-center'>
                  {billingCycle === 'yearly' && (
                    <span className='text-sm line-through mr-1'>
                      ₹{formatWithCommas(bronzePriceData.originalPrice)}
                    </span>
                  )}
                  <span className='text-4xl font-bold'>
                    ₹{formatWithCommas(bronzePriceData.displayPrice)}
                  </span>
                  <div className='ml-1'>
                    <span className='text-xs'>/month</span>
                  </div>
                </div>
                <div className='text-sm mt-2 h-5'>
                  {billingCycle === 'yearly'
                    ? `(Billed annually at ₹${formatWithCommas(
                        bronzePriceData.annualBilling
                      )})`
                    : ''}
                </div>
              </div>
              <div className='p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                {/* Content area with flex-grow to push the button to bottom */}
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
                    <div className='text-xs text-gray-400'>Available Space</div>
                  </div>
                </div>

                {/* Button container with mt-auto to push to bottom */}
                <div className='mt-6'>
                  <button
                    className='w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded cursor-pointer font-medium transition-colors'
                    onClick={() => handleUpgrade('Bronze')}
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            </div>

            {/* Silver Plan */}
            <div className='bg-white border rounded-lg overflow-hidden shadow-sm relative flex flex-col'>
              <div className='absolute top-0 right-0 bg-orange-500 text-white text-xs px-4 py-1 rounded-bl-lg font-bold'>
                BEST SELLER
              </div>
              <div className='p-6 bg-blue-500 text-white text-center'>
                <h3 className='text-xl font-semibold mb-4'>Silver</h3>
                <div className='flex items-center justify-center'>
                  {billingCycle === 'yearly' && (
                    <span className='text-sm line-through mr-1'>
                      ₹{formatWithCommas(silverPriceData.originalPrice)}
                    </span>
                  )}
                  <span className='text-4xl font-bold'>
                    ₹{formatWithCommas(silverPriceData.displayPrice)}
                  </span>
                  <div className='ml-1'>
                    <span className='text-xs'>/month</span>
                  </div>
                </div>
                <div className='text-sm mt-2 h-5'>
                  {billingCycle === 'yearly'
                    ? `(Billed annually at ₹${formatWithCommas(
                        silverPriceData.annualBilling
                      )})`
                    : ''}
                </div>
              </div>
              <div className='p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                {/* Content area with flex-grow to push the button to bottom */}
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
                    <div className='text-xs text-gray-400'>Available Space</div>
                  </div>
                </div>

                {/* Button container with mt-auto to push to bottom */}
                <div className='mt-6'>
                  <button
                    className='w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors cursor-pointer'
                    onClick={() => handleUpgrade('Silver')}
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            </div>

            {/* Gold Plan */}
            <div className='bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col'>
              <div className='p-6 bg-yellow-500 text-white text-center'>
                <h3 className='text-xl font-semibold mb-4'>Gold</h3>
                <div className='flex items-center justify-center'>
                  {billingCycle === 'yearly' && (
                    <span className='text-sm line-through mr-1'>
                      ₹{formatWithCommas(goldPriceData.originalPrice)}
                    </span>
                  )}
                  <span className='text-4xl font-bold'>
                    ₹{formatWithCommas(goldPriceData.displayPrice)}
                  </span>
                  <div className='ml-1'>
                    <span className='text-xs'>/month</span>
                  </div>
                </div>
                <div className='text-sm mt-2 h-5'>
                  {billingCycle === 'yearly'
                    ? `(Billed annually at ₹${formatWithCommas(
                        goldPriceData.annualBilling
                      )})`
                    : ''}
                </div>
              </div>
              <div className='p-4 bg-gray-800 text-white flex-grow flex flex-col'>
                {/* Content area with flex-grow to push the button to bottom */}
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
                    <div className='text-xs text-gray-400'>Available Space</div>
                  </div>
                </div>

                {/* Button container with mt-auto to push to bottom */}
                <div className='mt-6'>
                  <button
                    className='w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded cursor-pointer font-medium transition-colors'
                    onClick={() => handleUpgrade('Gold')}
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className='mt-8 text-xs text-gray-500'>
            <p>
              *The 50 percent yearly discount is a one-time offer when upgrading
              to an annual Bronze, Silver, or Gold plan. Plans will auto-renew
              at the full price one year after the discount is applied,
              depending on which option is selected. Once your purchased
              discount period is over, plans can also be adjusted to the
              full-priced monthly plan, unless canceled. If you cancel your
              account within 30 days of initial payment, a full refund will be
              issued. Cannot be combined with other offers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
