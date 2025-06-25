import { Router } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  downgradeToStarter,
  generatePDFReceipt,
} from '../controllers/paymentController';
import { protect } from '../middleware/protect';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = Router();

// Validation middleware
const createOrderValidation = [
  body('plan')
    .isIn(['BRONZE', 'SILVER', 'GOLD'])
    .withMessage('Invalid plan. Must be BRONZE, SILVER, or GOLD'),
  body('billing')
    .isIn(['monthly', 'yearly'])
    .withMessage('Invalid billing cycle. Must be monthly or yearly'),
];

const verifyPaymentValidation = [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required'),
  body('plan').isIn(['BRONZE', 'SILVER', 'GOLD']).withMessage('Invalid plan'),
  body('billing')
    .isIn(['monthly', 'yearly'])
    .withMessage('Invalid billing cycle'),
];

const receiptValidation = [
  param('paymentId')
    .custom(value => {
      // Allow both MongoDB ObjectId format and sample payment IDs for testing
      if (value === 'sample_payment_id' || /^[0-9a-fA-F]{24}$/.test(value)) {
        return true;
      }
      throw new Error('Invalid payment ID format');
    })
    .withMessage('Invalid payment ID format'),
];

// Routes
router.post(
  '/create-order',
  protect,
  createOrderValidation,
  validateRequest,
  createPaymentOrder
);

router.post(
  '/verify',
  protect,
  verifyPaymentValidation,
  validateRequest,
  verifyPayment
);

router.post('/downgrade-to-starter', protect, downgradeToStarter);

router.get(
  '/receipt/:paymentId',
  protect,
  receiptValidation,
  validateRequest,
  generatePDFReceipt
);

router.get('/history', protect, getPaymentHistory);

export default router;
