import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/stats', dashboardController.getStats);
router.get('/pipeline', dashboardController.getPipeline);
router.get('/industry-stats', dashboardController.getIndustryStats);
router.get('/score-trends', dashboardController.getScoreTrends);
router.get('/top-competitors', dashboardController.getTopCompetitors);
router.get('/recent-activity', dashboardController.getRecentActivity);

export default router;
