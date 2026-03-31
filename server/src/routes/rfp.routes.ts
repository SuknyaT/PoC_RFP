import { Router } from 'express';
import * as rfpController from '../controllers/rfp.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authMiddleware);

router.post('/', upload.single('file'), rfpController.createRfp);
router.get('/', rfpController.listRfps);
router.get('/:id', rfpController.getRfp);
router.patch('/:id', rfpController.updateRfp);
router.delete('/:id', rfpController.deleteRfp);
router.post('/:id/parse', rfpController.parseRfp);
router.post('/:id/analyze-scoring', rfpController.analyzeScoring);

export default router;
