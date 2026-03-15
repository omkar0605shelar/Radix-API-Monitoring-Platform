import { Router } from 'express';
import { getProjectEndpoints } from '../controllers/endpointController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect as any); // secure all routes

router.get('/project/:projectId', getProjectEndpoints as any);

export default router;
