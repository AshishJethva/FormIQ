import express from 'express';
import { getDashboard } from '../controllers/dashboardController';
import { protect } from '../middlewares/protectMiddleware';

const router = express.Router();

router.get('/', protect, getDashboard);

export default router;
