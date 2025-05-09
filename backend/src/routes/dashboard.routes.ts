import express from 'express';
import { getDashboard } from '../controllers/dashboard.controller';
import { protect } from '../controllers/auth.controller';

const router = express.Router();

// Protect all dashboard routes
router.use(protect);

router.get('/', getDashboard);

export default router;
