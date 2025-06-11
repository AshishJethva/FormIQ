import express from 'express';
import {
  signup,
  login,
  logout,
  verifyOTP,
  sendOTP,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from '../controllers/authController';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify_account', verifyOTP);
router.post('/send_otp', sendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token', verifyResetToken);

export default router;
