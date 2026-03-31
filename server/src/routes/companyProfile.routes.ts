import { Router } from 'express';
import * as companyProfileController from '../controllers/companyProfile.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', companyProfileController.getCompanyProfile);
router.put('/', companyProfileController.upsertCompanyProfile);
router.delete('/', companyProfileController.deleteCompanyProfile);

export default router;
