// src/components/account/PaymentStatus.tsx

'use client';

import React from 'react';
import { CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';

interface PaymentStatusProps {
  status: 'pending' | 'completed' | 'failed' | 'processing';
  plan?: string;
  amount?: number;
  currency?: string;
  className?: string;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  plan,
  amount,
  currency = 'INR',
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Payment Successful',
          description: `Your ${plan} plan has been activated successfully.`,
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Payment Failed',
          description:
            'There was an issue processing your payment. Please try again.',
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Payment Pending',
          description:
            'Your payment is being processed. This may take a few minutes.',
        };
      default:
        return {
          icon: CreditCard,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Processing Payment',
          description: 'Please wait while we process your payment...',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`border rounded-lg p-6 ${config.bgColor} ${config.borderColor} ${className}`}
    >
      <div className='flex items-center space-x-4'>
        <Icon className={`w-8 h-8 ${config.color}`} />
        <div className='flex-1'>
          <h3 className={`text-lg font-semibold ${config.color}`}>
            {config.title}
          </h3>
          <p className='text-gray-600 mt-1'>{config.description}</p>
          {amount && (
            <p className='text-sm text-gray-500 mt-2'>
              Amount: {currency} {amount.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
