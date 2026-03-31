import { Router } from 'express';
import * as historicalController from '../controllers/historical.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', historicalController.listBids);
router.post('/', historicalController.createBid);
router.patch('/:id', historicalController.updateBid);
router.delete('/:id', historicalController.deleteBid);
router.get('/similar/:rfpId', historicalController.findSimilarBids);

export default router;
