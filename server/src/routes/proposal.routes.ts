import { Router } from 'express';
import * as proposalController from '../controllers/proposal.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/:id/proposals', proposalController.createProposal);
router.get('/:id/proposals', proposalController.listProposals);
router.get('/:id/proposals/:pid', proposalController.getProposal);
router.patch('/:id/proposals/:pid', proposalController.updateProposal);
router.post('/:id/proposals/:pid/regenerate-section', proposalController.regenerateSection);
router.get('/:id/proposals/:pid/pdf', proposalController.exportPdf);

export default router;
