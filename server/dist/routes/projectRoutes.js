import { Router } from 'express';
import { importRepository, getUserProjects, getProjectDetails } from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = Router();
router.use(protect); // secure all routes below
router.post('/import', importRepository);
router.get('/', getUserProjects);
router.get('/:id', getProjectDetails);
export default router;
