import { Router } from 'express';
import { RemediationController } from '../controllers/remediationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect as any);

router.get('/registry', RemediationController.getRegistry as any);
router.post('/:id/approve', RemediationController.approveRemediation as any);
router.post('/:id/reject', RemediationController.rejectRemediation as any);
router.post('/:id/execute', RemediationController.executeRemediation as any);

export default router;
