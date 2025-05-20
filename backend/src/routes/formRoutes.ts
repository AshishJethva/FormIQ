// server/routes/formRoutes.ts
import express from 'express';
import formController from '../controllers/formController';
import { protect } from '../middlewares/protectMiddleware';

const router = express.Router();

// Apply authentication middleware to all form routes
router.use(protect);

// Form routes
router.get('/', formController.getForms);
router.get('/:formId', formController.getForm);
router.post('/', formController.createForm);
router.put('/:formId', formController.updateForm);
router.delete('/:formId', formController.deleteForm);

// Logo routes
router.put('/:formId/logo', formController.updateLogo);
router.delete('/:formId/logo', formController.removeLogo);

export default router;
