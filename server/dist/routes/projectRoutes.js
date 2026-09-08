import { Router } from 'express';
import { importRepository, getUserProjects, getProjectDetails, deleteProject } from '../controllers/projectController.js';
import { getProjectAnalytics } from '../controllers/analyticsController.js';
import { createVersion, getVersions } from '../controllers/versionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
const router = Router();
router.use(protect); // secure all routes below
router.post('/import', importRepository);
router.get('/', getUserProjects);
router.get('/:id', getProjectDetails);
router.delete('/:id', deleteProject);
// Analytics & Versioning
router.get('/:projectId/analytics', getProjectAnalytics);
router.post('/:projectId/version', authorize(['ADMIN', 'MEMBER']), createVersion);
router.get('/:projectId/versions', getVersions);
export default router;
