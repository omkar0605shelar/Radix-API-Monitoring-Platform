import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { AIService } from '../services/aiService.js';

const aiService = new AIService();

export const explainEndpoint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const explanation = await aiService.explainEndpoint(endpointId);
    res.json(explanation);
  } catch (error) {
    next(error);
  }
};

export const auditEndpoint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const auditResult = await aiService.auditEndpoint(endpointId);
    res.json(auditResult);
  } catch (error) {
    next(error);
  }
};

export const refactorEndpoint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const refactorResult = await aiService.refactorEndpoint(endpointId);
    res.json(refactorResult);
  } catch (error) {
    next(error);
  }
};

export const generateTestCases = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const testCasesResult = await aiService.generateTestCasesEndpoint(endpointId);
    res.json(testCasesResult);
  } catch (error) {
    next(error);
  }
};

export const predictCapacity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { usageData } = req.body;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const capacityResult = await aiService.predictCapacity(usageData);
    res.json(capacityResult);
  } catch (error) {
    next(error);
  }
};

export const generateSmartDocumentation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const docResult = await aiService.generateSmartDocumentationEndpoint(endpointId);
    res.json(docResult);
  } catch (error) {
    next(error);
  }
};

export const compareAiModels = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId, testPrompt } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const comparisonResult = await aiService.compareAiModels(endpointId, testPrompt);
    res.json(comparisonResult);
  } catch (error) {
    next(error);
  }
};

export const generateSmartTestData = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId } = req.params;
  const { usagePatterns } = req.body;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const testDataResult = await aiService.generateSmartTestData(endpointId, usagePatterns);
    res.json(testDataResult);
  } catch (error) {
    next(error);
  }
};

export const autoRemediateSecurity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const remediateResult = await aiService.autoRemediateSecurity(endpointId);
    res.json(remediateResult);
  } catch (error) {
    next(error);
  }
};

export const checkPerformanceBudget = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId } = req.params;
  const { currentMetrics } = req.body;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const budgetResult = await aiService.checkPerformanceBudget(endpointId, currentMetrics);
    res.json(budgetResult);
  } catch (error) {
    next(error);
  }
};

export const checkCompliance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId, complianceStandard } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const complianceResult = await aiService.checkCompliance(endpointId, complianceStandard);
    res.json(complianceResult);
  } catch (error) {
    next(error);
  }
};

export const reduceAlerts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { alertsData, recentFixes } = req.body;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const reducedAlerts = await aiService.reduceAlerts(alertsData, recentFixes);
    res.json(reducedAlerts);
  } catch (error) {
    next(error);
  }
};

export const designRecommendations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const recommendations = await aiService.designRecommendations(endpointId);
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};

export const crossRegionAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { regionData } = req.body;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const analytics = await aiService.crossRegionAnalytics(regionData);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
};

export const autoFixEndpoint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const fixResult = await aiService.autoFixEndpoint(endpointId);
    res.json(fixResult);
  } catch (error) {
    next(error);
  }
};

export const generateSelfHealingTests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { endpointId } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const testResult = await aiService.generateSelfHealingTests(endpointId);
    res.json(testResult);
  } catch (error) {
    next(error);
  }
};
