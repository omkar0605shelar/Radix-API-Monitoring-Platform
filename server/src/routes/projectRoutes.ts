import { Router } from 'express';
import { importRepository, getUserProjects, getProjectDetails, deleteProject } from '../controllers/projectController.js';
import { getProjectAnalytics } from '../controllers/analyticsController.js';
import { createVersion, getVersions } from '../controllers/versionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(protect as any); // secure all routes below

router.post('/import', importRepository as any);
router.get('/', getUserProjects as any);
router.get('/:id', getProjectDetails as any);
router.delete('/:id', deleteProject as any);

// Analytics & Versioning
router.get('/:projectId/analytics', getProjectAnalytics as any);
router.post('/:projectId/version', authorize(['ADMIN', 'MEMBER']), createVersion as any);
router.get('/:projectId/versions', getVersions as any);

export default router;
