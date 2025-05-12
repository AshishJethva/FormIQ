import express from 'express';
import {
  signup,
  login,
  logout,
  verifyOTP,
  sendOTP,
} from '../controllers/authController';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/verify_account', verifyOTP);
router.post('/send_otp', sendOTP);

export default router;
