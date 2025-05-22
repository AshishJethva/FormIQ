import express from 'express';
import { getDashboard } from '../controllers/dashboardController';
import { protect } from '../middleware/protect';

const router = express.Router();

router.get('/', protect, getDashboard);

export default router;
