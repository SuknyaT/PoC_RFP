import { Router } from 'express';
import * as competitorController from '../controllers/competitor.controller.js';
import { authMiddleware } from '../middleware/auth.js';

export const competitorRfpRoutes = Router();

competitorRfpRoutes.use(authMiddleware);

// RFP-specific competitor routes
competitorRfpRoutes.post('/:id/competitors', competitorController.linkCompetitors);
competitorRfpRoutes.get('/:id/competitors', competitorController.getRfpCompetitors);
competitorRfpRoutes.get('/:id/competitors/discover', competitorController.discoverCompetitors);
competitorRfpRoutes.post('/:id/competitors/add-suggested', competitorController.addSuggestedCompetitor);
