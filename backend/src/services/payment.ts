// src/services/payment.ts
import Razorpay from 'razorpay';
import crypto from 'crypto';

interface CreateOrderData {
  amount: number;
  currency: string;
  receipt: string;
  notes?: any;
}

interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class PaymentService {
  private razorpay: Razorpay | null = null;

  constructor() {
    this.initializeRazorpay();
  }

  private initializeRazorpay() {
    try {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials are not configured');
      }

      if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
        throw new Error('Invalid Razorpay Key ID format');
      }

      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } catch (error: any) {
      console.error('❌ Failed to initialize Razorpay:', error.message);
      throw error;
    }
  }

  async createOrder(data: CreateOrderData) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay service not initialized');
      }

      console.log('🔄 Creating Razorpay order:', {
        amount: data.amount,
        currency: data.currency,
        receipt: data.receipt,
        receiptLength: data.receipt.length,
        amountInPaisa: data.amount * 100,
      });

      // Validate input data
      if (!data.amount || data.amount <= 0) {
        throw new Error('Invalid amount: must be greater than 0');
      }

      if (!data.currency || data.currency !== 'INR') {
        throw new Error('Currency must be INR');
      }

      if (!data.receipt) {
        throw new Error('Receipt is required');
      }

      if (data.receipt.length > 40) {
        throw new Error(
          `Receipt too long: ${data.receipt.length} characters (max 40)`
        );
      }

      const orderData = {
        amount: Math.round(data.amount * 100),
        currency: data.currency,
        receipt: data.receipt,
        notes: data.notes || {},
        payment_capture: 1, // Auto capture
      };

      console.log('📦 Order data being sent to Razorpay:', {
        ...orderData,
        receiptLength: orderData.receipt.length,
      });

      const order = await this.razorpay.orders.create(orderData);

      console.log(' Razorpay order created successfully:', {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        receipt: order.receipt,
      });

      return {
        success: true,
        order,
      };
    } catch (error: any) {
      console.error('❌ Razorpay order creation failed:', {
        name: error.name,
        message: error.message,
        description: error.description,
        code: error.code,
        source: error.source,
        step: error.step,
        reason: error.reason,
        metadata: error.metadata,
        statusCode: error.statusCode,
        stack: error.stack,
        fullError: JSON.stringify(error, null, 2),
      });

      // Parse the error properly
      let errorMessage = 'Unknown error';

      if (error.error && error.error.description) {
        errorMessage = error.error.description;
      } else if (error.description) {
        errorMessage = error.description;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle specific Razorpay errors
      if (error.statusCode) {
        switch (error.statusCode) {
          case 400:
            throw new Error(`Razorpay validation error: ${errorMessage}`);
          case 401:
            throw new Error(
              'Razorpay authentication failed. Check your API keys.'
            );
          case 500:
            throw new Error('Razorpay server error. Please try again later.');
          default:
            throw new Error(
              `Razorpay API error (${error.statusCode}): ${errorMessage}`
            );
        }
      }

      // Handle network/connection errors
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error(
          'Unable to connect to Razorpay. Check your internet connection.'
        );
      }

      // Generic error handling
      throw new Error(`Failed to create payment order: ${errorMessage}`);
    }
  }

  verifyPayment(data: VerifyPaymentData): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        data;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.error('❌ Missing payment verification data');
        return false;
      }

      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      const isValid = expectedSignature === razorpay_signature;
      console.log(
        isValid
          ? ' Payment signature verified'
          : '❌ Payment signature verification failed'
      );

      return isValid;
    } catch (error: any) {
      console.error('❌ Payment verification error:', error);
      return false;
    }
  }

  async getPaymentDetails(paymentId: string) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay service not initialized');
      }

      const payment = await this.razorpay.payments.fetch(paymentId);
      console.log('💳 Payment details fetched successfully');
      return payment;
    } catch (error: any) {
      console.error('❌ Failed to fetch payment details:', error);
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }
  }

  async refundPayment(paymentId: string, amount?: number) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay service not initialized');
      }

      const refundData: any = {};
      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to paisa
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundData);
      console.log('💰 Refund processed successfully:', refund);
      return refund;
    } catch (error: any) {
      console.error('❌ Refund failed:', error);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new PaymentService();
