import { Router } from 'express';
import { getProjectEndpoints } from '../controllers/endpointController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = Router();
router.use(protect); // secure all routes
router.get('/project/:projectId', getProjectEndpoints);
export default router;
