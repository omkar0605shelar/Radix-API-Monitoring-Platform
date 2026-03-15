import { Router } from 'express';
import { importRepository, getUserProjects, getProjectDetails } from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect as any); // secure all routes below

router.post('/import', importRepository as any);
router.get('/', getUserProjects as any);
router.get('/:id', getProjectDetails as any);

export default router;
