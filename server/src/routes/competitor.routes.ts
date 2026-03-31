import { Router } from 'express';
import * as competitorController from '../controllers/competitor.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// Competitor CRUD
router.get('/', competitorController.listCompetitors);
router.post('/', competitorController.createCompetitor);
router.get('/:id', competitorController.getCompetitor);
router.patch('/:id', competitorController.updateCompetitor);
router.delete('/:id', competitorController.deleteCompetitor);

export default router;
