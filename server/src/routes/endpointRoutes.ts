import { Router } from 'express';
import { getProjectEndpoints } from '../controllers/endpointController.js';
import { 
  explainEndpoint, 
  auditEndpoint, 
  refactorEndpoint, 
  generateTestCases,
  autoFixEndpoint,
  generateSelfHealingTests,
  predictCapacity,
  generateSmartDocumentation,
  compareAiModels,
  generateSmartTestData,
  autoRemediateSecurity,
  checkPerformanceBudget,
  checkCompliance,
  reduceAlerts,
  designRecommendations,
  crossRegionAnalytics
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect as any); // secure all routes

router.get('/project/:projectId', getProjectEndpoints as any);
router.get('/:endpointId/explain', explainEndpoint as any);
router.get('/:endpointId/audit', auditEndpoint as any);
router.get('/:endpointId/refactor', refactorEndpoint as any);
router.get('/:endpointId/test-cases', generateTestCases as any);
router.get('/:endpointId/auto-fix', autoFixEndpoint as any);
router.get('/:endpointId/self-healing-tests', generateSelfHealingTests as any);
router.get('/:endpointId/predict-capacity', predictCapacity as any);
router.get('/:endpointId/smart-docs', generateSmartDocumentation as any);
router.get('/:endpointId/ai-comparison', compareAiModels as any);
router.get('/:endpointId/smart-test-data', generateSmartTestData as any);
router.get('/:endpointId/auto-remediate', autoRemediateSecurity as any);
router.get('/:endpointId/performance-budget', checkPerformanceBudget as any);
router.get('/:endpointId/compliance/:standard', checkCompliance as any);
router.get('/:endpointId/reduce-alerts', reduceAlerts as any);
router.get('/:endpointId/design-recs', designRecommendations as any);
router.get('/:endpointId/cross-region', crossRegionAnalytics as any);

export default router;
