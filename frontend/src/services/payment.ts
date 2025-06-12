// src/services/payment.ts

import axios from 'axios';
import { apiConfig } from '@/config/api';

// Create axios instance
const api = axios.create({
  baseURL: apiConfig.url,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add request interceptor for auth tokens
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export interface CreateOrderData {
  plan: 'BRONZE' | 'SILVER' | 'GOLD';
  billing: 'monthly' | 'yearly';
}

export interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan: string;
  billing: string;
}

class PaymentService {
  async createOrder(data: CreateOrderData) {
    try {
      console.log('🛒 Creating payment order:', data);
      const response = await api.post('/payment/create-order', data);
      console.log(' Payment order created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create payment order:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to create payment order'
      );
    }
  }

  async verifyPayment(data: VerifyPaymentData) {
    try {
      console.log('🔍 Verifying payment:', {
        orderId: data.razorpay_order_id,
        paymentId: data.razorpay_payment_id,
        plan: data.plan,
        billing: data.billing,
      });

      const response = await api.post('/payment/verify', data);
      console.log(' Payment verified:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Payment verification failed:', error);
      throw new Error(
        error.response?.data?.message || 'Payment verification failed'
      );
    }
  }

  async downgradeToStarter() {
    try {
      console.log('📉 Downgrading to STARTER plan');
      const response = await api.post('/payment/downgrade-to-starter');
      console.log(' Downgrade successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Downgrade failed:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to downgrade plan'
      );
    }
  }

  async downloadReceipt(paymentId: string): Promise<Blob> {
    try {
      console.log('📄 Downloading receipt for payment:', paymentId);

      // ✅ Handle both real payment IDs and sample ID
      const response = await api.get(`/payment/receipt/${paymentId}`, {
        responseType: 'blob', // Important for file downloads
      });

      console.log('✅ Receipt downloaded successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Receipt download failed:', error);

      // ✅ Better error handling for different scenarios
      if (error.response?.status === 404) {
        throw new Error(
          'Payment record not found. Please check the payment ID.'
        );
      } else if (error.response?.status === 400) {
        throw new Error('Invalid payment ID format.');
      } else {
        throw new Error(
          error.response?.data?.message || 'Failed to download receipt'
        );
      }
    }
  }

  async getPaymentHistory() {
    try {
      const response = await api.get('/payment/history');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get payment history:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to get payment history'
      );
    }
  }
}

const paymentService = new PaymentService();
export default paymentService;
