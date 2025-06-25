'use client';

import React, { useEffect, useState } from 'react';
import { Download, Calendar, CreditCard, CheckCircle } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import PaymentService from '@/services/payment';
import { toast } from 'sonner';

interface PaymentRecord {
  id: string;
  orderId: string;
  paymentId: string;
  plan: string;
  amount: number;
  currency: string;
  billing: string;
  status: string;
  createdAt: string;
}

const PaymentHistory: React.FC = () => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { downloadReceipt } = usePayment();

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await PaymentService.getPaymentHistory();
      setPaymentHistory(response.data.paymentHistory || []);
    } catch {
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency === 'INR' ? '₹' : '$'}${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className='p-6 bg-white rounded-lg shadow-sm'>
        <div className='animate-pulse'>
          <div className='h-6 bg-gray-200 rounded w-1/4 mb-4'></div>
          <div className='space-y-3'>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded w-3/4'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 bg-white rounded-lg shadow-sm'>
      <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
        <CreditCard className='h-5 w-5' />
        Payment History
      </h3>

      {paymentHistory.length === 0 ? (
        <div className='text-center py-8 text-gray-500'>
          <CreditCard className='h-12 w-12 mx-auto mb-4 text-gray-300' />
          <p>No payment history found</p>
          <p className='text-sm'>Your payment transactions will appear here</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {paymentHistory.map(payment => (
            <div
              key={payment.id}
              className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors'
            >
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-green-500' />
                      <span className='font-medium text-gray-900'>
                        {payment.plan} Plan
                      </span>
                    </div>
                    <span className='px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full'>
                      {payment.status}
                    </span>
                  </div>

                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600'>
                    <div>
                      <span className='font-medium'>Amount:</span>
                      <br />
                      {formatAmount(payment.amount, payment.currency)}
                    </div>
                    <div>
                      <span className='font-medium'>Billing:</span>
                      <br />
                      {payment.billing}
                    </div>
                    <div>
                      <span className='font-medium'>Date:</span>
                      <br />
                      <div className='flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        {formatDate(payment.createdAt)}
                      </div>
                    </div>
                    <div>
                      <span className='font-medium'>Payment ID:</span>
                      <br />
                      <code className='text-xs bg-gray-100 px-1 rounded'>
                        {payment.paymentId.slice(-8)}
                      </code>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => downloadReceipt(payment.paymentId)}
                  className='ml-4 px-3 py-2 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors flex items-center gap-2'
                  title='Download Receipt'
                >
                  <Download className='h-4 w-4' />
                  Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
