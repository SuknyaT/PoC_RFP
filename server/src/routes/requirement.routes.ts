import { Router } from 'express';
import * as requirementController from '../controllers/requirement.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/:id/requirements', requirementController.getRequirements);
router.post('/:id/requirements/extract', requirementController.extractRequirements);
router.patch('/:id/requirements/:rid', requirementController.updateRequirement);

export default router;
