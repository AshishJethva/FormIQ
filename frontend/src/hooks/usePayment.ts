// src/hooks/usePayment.ts

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import PaymentService, { CreateOrderData } from '@/services/payment';
import {
  fetchUserProfile,
  selectUserProfile,
} from '@/redux/slices/userProfile/userProfileSlice';
import { loadRazorpayScript, RazorpayOptions } from '@/lib/razorpay';
import type { StoreDispatch } from '@/redux/store';

export const usePayment = () => {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<StoreDispatch>();
  const userProfile = useSelector(selectUserProfile);

  const initiatePayment = async (planData: CreateOrderData) => {
    setProcessingPlan(planData.plan);

    try {
      // Load Razorpay script if not already loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load payment system');
      }

      // Create payment order
      const orderResponse = await PaymentService.createOrder(planData);
      const order = orderResponse.data;

      // Get user info for prefill
      const userName = userProfile?.user.name || 'User';
      const userEmail = userProfile?.user.email || 'user@example.com';

      // Razorpay checkout options
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: order.currency,
        name: 'FormIQ',
        description: `${planData.plan} Plan - ${
          planData.billing === 'yearly' ? 'Annual' : 'Monthly'
        } Billing`,
        order_id: order.id,
        handler: async response => {
          try {
            // Verify payment on backend
            await PaymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planData.plan,
              billing: planData.billing,
            });

            // Refresh user profile to get updated plan
            await dispatch(fetchUserProfile());

            toast.success('🎉 Payment Successful!', {
              description: `Your ${planData.plan} plan is now active. Welcome to premium features!`,
              duration: 3000,
            });

            // Redirect to account page
            router.push('/myaccount?upgraded=true');
          } catch (verificationError: any) {
            console.error('❌ Payment verification failed:', verificationError);
            toast.error('Payment Verification Failed', {
              description:
                verificationError.message ||
                'Please contact support if amount was deducted.',
              duration: 8000,
            });
          } finally {
            setProcessingPlan(null);
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: '#4F46E5',
        },
        modal: {
          ondismiss: () => {
            setProcessingPlan(null);
            toast.info('Payment Cancelled', {
              description:
                'You can upgrade anytime from your account settings.',
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('❌ Payment initiation failed:', error);
      toast.error('Payment Failed', {
        description:
          error.message || 'Failed to initiate payment. Please try again.',
        duration: 5000,
      });
      setProcessingPlan(null);
    }
  };

  const downgradeToStarter = async () => {
    setIsDowngrading(true);

    try {
      // Call downgrade API
      await PaymentService.downgradeToStarter();

      // Refresh user profile
      await dispatch(fetchUserProfile());

      toast.success(' Plan Downgraded', {
        description: 'You have been downgraded to the FREE Starter plan.',
        duration: 5000,
      });
    } catch (error: any) {
      console.error('❌ Downgrade failed:', error);
      toast.error('Downgrade Failed', {
        description:
          error.message || 'Failed to downgrade plan. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsDowngrading(false);
    }
  };

  const downloadReceipt = async (paymentId: string) => {
    try {
      const receiptBlob = await PaymentService.downloadReceipt(paymentId);

      // Create download link
      const url = window.URL.createObjectURL(receiptBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('❌ Receipt download failed:', error);
      toast.error('Download Failed', {
        description: error.message || 'Failed to download receipt.',
      });
    }
  };

  return {
    initiatePayment,
    downgradeToStarter,
    downloadReceipt,
    processingPlan, // Which specific plan is being processed
    isDowngrading,
    isProcessing: !!processingPlan, // For backward compatibility
  };
};
