// src/controllers/paymentController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import PaymentService from '../services/payment';
import UserProfile from '../models/UserProfile';
import User from '../models/User';
import PaymentHistory from '../models/PaymentHistory';
import { PlanType, isValidPlanType, getPlanConfig } from '../config/plans';

interface CreateOrderRequest extends Request {
  body: {
    plan: PlanType;
    billing: 'monthly' | 'yearly';
  };
}

interface VerifyPaymentRequest extends Request {
  body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan: PlanType;
    billing: 'monthly' | 'yearly';
  };
}

// Helper function to generate short receipt (ensuring under 40 chars)
const generateReceipt = (userId: string, plan: string): string => {
  const timestamp = Date.now().toString();
  const shortUserId = userId.slice(-6); // Last 6 characters of user ID
  const shortTimestamp = timestamp.slice(-6); // Last 6 digits of timestamp
  const planCode = plan.charAt(0); // First letter of plan (B/S/G)

  // Format: [PlanCode][6-digit-userId][6-digit-timestamp] = 13 characters total
  const receipt = `${planCode}${shortUserId}${shortTimestamp}`;

  // Double check it's under 40 characters
  return receipt.length > 40 ? receipt.substring(0, 40) : receipt;
};

export const createPaymentOrder = async (
  req: CreateOrderRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { plan, billing } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    // Validate plan type
    if (!isValidPlanType(plan)) {
      return next(new ApiError('Invalid plan type', 400));
    }

    // Get plan configuration
    const planConfig = getPlanConfig(plan);
    if (!planConfig) {
      return next(new ApiError('Plan configuration not found', 400));
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billing)) {
      return next(new ApiError('Invalid billing cycle', 400));
    }

    // Calculate amount based on billing cycle
    let amount = planConfig.monthlyPrice;
    if (billing === 'yearly') {
      amount = planConfig.yearlyPrice;
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return next(new ApiError('Invalid plan amount calculated', 500));
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const userProfile = await UserProfile.findOne({ userId: userObjectId });
    const userDetails = await User.findById(userObjectId);

    if (!userDetails) {
      return next(new ApiError('User not found', 404));
    }

    // Check if user is already on this plan or higher
    if (userProfile?.plan?.type === plan) {
      return next(new ApiError(`You are already on the ${plan} plan`, 400));
    }

    // Generate short receipt (max 40 characters)
    const receipt = generateReceipt(userId, plan);

    const orderData = {
      amount,
      currency: 'INR',
      receipt,
      notes: {
        userId,
        plan,
        billing,
        userEmail: userDetails.email || 'unknown',
        userName: userDetails.name || 'unknown',
        currentPlan: userProfile?.plan?.type || 'STARTER',
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const result = await PaymentService.createOrder(orderData);

      if (!result || !result.order) {
        console.error('❌ Invalid response from PaymentService:', result);
        return next(new ApiError('Failed to create payment order', 500));
      }

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result.order,
            'Payment order created successfully'
          )
        );
    } catch (paymentError: any) {
      console.error('❌ PaymentService error:', paymentError);
      return next(
        new ApiError(`Payment service error: ${paymentError.message}`, 500)
      );
    }
  } catch (error: any) {
    console.error('❌ Create payment order error:', error);
    next(new ApiError(error.message || 'Failed to create payment order', 500));
  }
};

export const verifyPayment = async (
  req: VerifyPaymentRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      billing,
    } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return next(new ApiError('Missing payment verification data', 400));
    }

    // Validate plan type
    if (!isValidPlanType(plan)) {
      return next(new ApiError('Invalid plan type', 400));
    }

    // Verify payment signature
    const isValidPayment = PaymentService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValidPayment) {
      return next(
        new ApiError('Payment verification failed - Invalid signature', 400)
      );
    }

    // Get payment details from Razorpay for additional verification
    try {
      const paymentDetails =
        await PaymentService.getPaymentDetails(razorpay_payment_id);

      // Verify payment status
      if (paymentDetails.status !== 'captured') {
        return next(
          new ApiError(
            `Payment not successful. Status: ${paymentDetails.status}`,
            400
          )
        );
      }
    } catch (paymentError: any) {
      console.error(
        '⚠️ Could not fetch payment details:',
        paymentError.message
      );
    }

    // Get plan configuration
    const planConfig = getPlanConfig(plan);
    if (!planConfig) {
      return next(new ApiError('Invalid plan configuration', 400));
    }

    // Find user profile
    const userObjectId = new mongoose.Types.ObjectId(userId);
    let userProfile = await UserProfile.findOne({ userId: userObjectId });

    if (!userProfile) {
      return next(new ApiError('User profile not found', 404));
    }

    // Store the previous plan for logging
    const previousPlan = userProfile.plan.type;

    // Calculate amount
    const amount =
      billing === 'yearly' ? planConfig.yearlyPrice : planConfig.monthlyPrice;

    // Save payment to history BEFORE updating user plan
    const paymentRecord = new PaymentHistory({
      userId: userObjectId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      plan,
      billing,
      amount,
      currency: 'INR',
      status: 'completed',
    });

    await paymentRecord.save();

    // Calculate new plan details
    const now = new Date();
    const expiresAt =
      billing === 'yearly'
        ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month

    const newPlanDetails = {
      type: plan,
      formsLimit: planConfig.formsLimit,
      formsUsed: userProfile.plan.formsUsed || 0, // Keep current usage
      upgradeDate: now,
      expiresAt,
      billingCycle: billing,
      canCreateForms: (userProfile.plan.formsUsed || 0) < planConfig.formsLimit,
      remainingForms: Math.max(
        0,
        planConfig.formsLimit - (userProfile.plan.formsUsed || 0)
      ),
    };

    // Update user plan
    userProfile.plan = {
      ...userProfile.plan,
      ...newPlanDetails,
    };

    await userProfile.save();

    // Create response data
    const responseData = {
      success: true,
      plan: {
        type: userProfile.plan.type,
        formsLimit: userProfile.plan.formsLimit,
        formsUsed: userProfile.plan.formsUsed,
        canCreateForms: userProfile.plan.canCreateForms,
        remainingForms: userProfile.plan.remainingForms,
        upgradeDate: userProfile.plan.upgradeDate,
        expiresAt: userProfile.plan.expiresAt,
        billingCycle: userProfile.plan.billingCycle,
      },
      payment: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount:
          billing === 'yearly'
            ? planConfig.yearlyPrice
            : planConfig.monthlyPrice,
        currency: 'INR',
        billing,
        historyId: paymentRecord._id,
      },
      upgrade: {
        fromPlan: previousPlan,
        toPlan: plan,
        upgradeDate: now,
      },
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          responseData,
          `Payment verified and plan upgraded to ${plan} successfully!`
        )
      );
  } catch (error: any) {
    console.error('❌ Payment verification error:', error);
    next(new ApiError(error.message || 'Payment verification failed', 500));
  }
};

export const getPaymentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    // Get user profile with current plan
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const userProfile = await UserProfile.findOne({
      userId: userObjectId,
    }).select('plan');

    if (!userProfile) {
      return next(new ApiError('User profile not found', 404));
    }

    // Get user details
    const userDetails = await User.findById(userObjectId).select(
      'name email createdAt'
    );

    // Get actual payment history from database
    const payments = await PaymentHistory.find({ userId: userObjectId })
      .sort({ createdAt: -1 }) // Latest first
      .limit(50); // Limit to last 50 payments

    // Format payment history
    const formattedPayments = payments.map(payment => ({
      id: payment._id.toString(),
      orderId: payment.razorpayOrderId,
      paymentId: payment.razorpayPaymentId,
      plan: payment.plan,
      amount: payment.amount,
      currency: payment.currency,
      billing: payment.billing,
      status: payment.status,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    const paymentHistory = {
      user: {
        name: userDetails?.name || 'Unknown',
        email: userDetails?.email || 'Unknown',
        memberSince: userDetails?.createdAt || null,
      },
      currentPlan: {
        type: userProfile.plan.type,
        formsLimit: userProfile.plan.formsLimit,
        formsUsed: userProfile.plan.formsUsed,
        canCreateForms: userProfile.plan.canCreateForms,
        remainingForms: userProfile.plan.remainingForms,
        upgradeDate: userProfile.plan.upgradeDate || null,
        expiresAt: userProfile.plan.expiresAt || null,
        billingCycle: userProfile.plan.billingCycle || null,
      },
      paymentHistory: formattedPayments,
      totalPayments: payments.length,
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          paymentHistory,
          'Payment history retrieved successfully'
        )
      );
  } catch (error: any) {
    console.error('❌ Get payment history error:', error);
    next(new ApiError(error.message || 'Failed to get payment history', 500));
  }
};

export const downgradeToStarter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const userProfile = await UserProfile.findOne({ userId: userObjectId });

    if (!userProfile) {
      return next(new ApiError('User profile not found', 404));
    }

    // Check if user is already on STARTER plan
    if (userProfile.plan.type === 'STARTER') {
      return next(new ApiError('You are already on the STARTER plan', 400));
    }

    const previousPlan = userProfile.plan.type;

    // Reset to STARTER plan
    userProfile.plan = {
      type: 'STARTER',
      formsLimit: 5,
      formsUsed: Math.min(userProfile.plan.formsUsed || 0, 5), // Cap at 5 forms
      canCreateForms: (userProfile.plan.formsUsed || 0) < 5,
      remainingForms: Math.max(0, 5 - (userProfile.plan.formsUsed || 0)),
      upgradeDate: undefined,
      expiresAt: undefined,
      billingCycle: undefined,
    };

    await userProfile.save();

    const responseData = {
      success: true,
      plan: {
        type: userProfile.plan.type,
        formsLimit: userProfile.plan.formsLimit,
        formsUsed: userProfile.plan.formsUsed,
        canCreateForms: userProfile.plan.canCreateForms,
        remainingForms: userProfile.plan.remainingForms,
      },
      downgrade: {
        fromPlan: previousPlan,
        toPlan: 'STARTER',
        downgradeDate: new Date(),
      },
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          responseData,
          'Successfully downgraded to STARTER plan'
        )
      );
  } catch (error: any) {
    console.error('❌ Downgrade error:', error);
    next(new ApiError(error.message || 'Failed to downgrade plan', 500));
  }
};

export const generatePDFReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return next(new ApiError('User not authenticated', 401));
    }

    if (!paymentId) {
      return next(new ApiError('Payment ID is required', 400));
    }

    const formatRupees = (amount: number): string => {
      return `₹${amount.toLocaleString('en-IN')}`;
    };

    const userObjectId = new mongoose.Types.ObjectId(userId);
    let paymentRecord: any;

    //  Handle sample payment ID for testing
    if (paymentId === 'sample_payment_id') {
      // Get user profile to create sample receipt with current plan
      const userProfile = await UserProfile.findOne({ userId: userObjectId });
      const planConfig = userProfile?.plan?.type
        ? getPlanConfig(userProfile.plan.type as PlanType)
        : getPlanConfig('SILVER'); // Default to SILVER for sample

      paymentRecord = {
        _id: 'sample_payment_id',
        razorpayPaymentId: 'pay_sample123456789',
        razorpayOrderId: 'order_sample123456789',
        plan: userProfile?.plan?.type || 'SILVER',
        billing: userProfile?.plan?.billingCycle || 'yearly',
        amount: planConfig?.yearlyPrice || 3570,
        currency: 'INR',
        status: 'completed',
        createdAt: userProfile?.plan?.upgradeDate || new Date(),
      };
    } else {
      //  Get actual payment record from database
      paymentRecord = await PaymentHistory.findOne({
        _id: paymentId,
        userId: userObjectId, // Ensure user owns this payment
      });

      if (!paymentRecord) {
        return next(new ApiError('Payment record not found', 404));
      }
    }

    // Get user details
    const userDetails = await User.findById(userObjectId);
    if (!userDetails) {
      return next(new ApiError('User not found', 404));
    }

    // Create PDF
    const doc = new PDFDocument({
      margin: 50,
      bufferPages: true,
      compress: false,
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="receipt-${paymentId}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(24).text('FormIQ Payment Receipt', { align: 'center' });
    doc.moveDown();

    // Company details
    doc
      .fontSize(12)
      .text('FormIQ Technologies Pvt Ltd', 50, 150)
      .text('123 Luxuria Business Hub', 50, 165)
      .text('Surat, Gujarat 395007', 50, 180)
      .text('contact@formiq.com', 50, 195)
      .text('GST: 24XXXXX1234X1ZX', 50, 210);

    // Customer details
    doc
      .text('Bill To:', 350, 150, { align: 'left' })
      .text(userDetails.name, 350, 165)
      .text(userDetails.email, 350, 180)
      .text(`Customer ID: ${userId.slice(-8)}`, 350, 195);

    // Add horizontal line
    doc.moveTo(50, 240).lineTo(550, 240).stroke();

    // Payment details
    doc
      .moveDown(2)
      .fontSize(16)
      .text('Payment Details', 50, 260, { underline: true })
      .moveDown()
      .fontSize(12)
      .text(`Receipt ID: ${paymentRecord._id}`, 50, 290)
      .text(`Payment ID: ${paymentRecord.razorpayPaymentId}`, 50, 305)
      .text(`Order ID: ${paymentRecord.razorpayOrderId}`, 50, 320)
      .text(`Plan: ${paymentRecord.plan}`, 50, 335)
      .text(`Billing Cycle: ${paymentRecord.billing}`, 50, 350)
      .text(`Amount: ${formatRupees(paymentRecord.amount)}`, 50, 365)
      .text(`Currency: ${paymentRecord.currency}`, 50, 380)
      .text(`Status: ${paymentRecord.status.toUpperCase()}`, 50, 395)
      .text(
        `Payment Date: ${new Date(paymentRecord.createdAt).toLocaleDateString('en-IN')}`,
        50,
        410
      );

    // Add another horizontal line
    doc.moveTo(50, 440).lineTo(550, 440).stroke();

    // Plan benefits
    const planBenefits = {
      BRONZE: ['25 Forms', '1,000 Monthly Submissions', '1 GB Storage'],
      SILVER: ['50 Forms', '2,500 Monthly Submissions', '10 GB Storage'],
      GOLD: ['100 Forms', '10,000 Monthly Submissions', '100 GB Storage'],
    };

    doc
      .fontSize(14)
      .text('Plan Benefits:', 50, 460, { underline: true })
      .fontSize(12);

    const benefits =
      planBenefits[paymentRecord.plan as keyof typeof planBenefits] || [];
    benefits.forEach((benefit, index) => {
      doc.text(`• ${benefit}`, 50, 480 + index * 15);
    });

    // Add total amount box
    doc.rect(350, 480, 200, 60).stroke();
    doc
      .fontSize(14)
      .text('Total Amount Paid:', 360, 495)
      .fontSize(18)
      .text(formatRupees(paymentRecord.amount), 360, 515, {
        align: 'left',
      });

    // Add footer
    doc
      .fontSize(10)
      .text('Thank you for choosing FormIQ!', 50, 600, { align: 'center' })
      .text(
        'This is a computer-generated receipt and does not require a signature.',
        50,
        615,
        { align: 'center' }
      )
      .text('For any queries, contact us at support@formiq.com', 50, 630, {
        align: 'center',
      });

    // Add sample notice if using sample data
    if (paymentId === 'sample_payment_id') {
      doc
        .fontSize(8)
        .fillColor('red')
        .text('*** SAMPLE RECEIPT FOR TESTING PURPOSES ***', 50, 650, {
          align: 'center',
        });
    }

    // Finalize PDF
    doc.end();
  } catch (error: any) {
    console.error('❌ Receipt generation error:', error);
    next(new ApiError(error.message || 'Failed to generate receipt', 500));
  }
};
