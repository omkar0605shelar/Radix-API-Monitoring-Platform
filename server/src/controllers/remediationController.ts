import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { RemediationService } from '../services/incident/remediation/remediationService.js';
import { RemediationExecutor } from '../services/incident/remediation/remediationExecutor.js';
import { RemediationRegistry } from '../services/incident/remediation/remediationRegistry.js';

export class RemediationController {
  static async approveRemediation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const result = await RemediationService.approveRemediation(id, userId, reason);
      res.status(200).json({
        message: 'Remediation approved and executed successfully',
        result
      });
    } catch (error: any) {
      console.error('Error approving remediation:', error);
      const status = error.message?.includes('Forbidden') ? 403 : 500;
      res.status(status).json({ message: error.message || 'Approval failed' });
    }
  }

  static async rejectRemediation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const result = await RemediationService.rejectRemediation(id, userId, reason || 'Rejected by reviewer');
      res.status(200).json({
        message: 'Remediation action rejected',
        result
      });
    } catch (error: any) {
      console.error('Error rejecting remediation:', error);
      res.status(500).json({ message: error.message || 'Rejection failed' });
    }
  }

  static async executeRemediation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'SYSTEM';
      const result = await RemediationExecutor.executeAction(id, userId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error executing remediation:', error);
      res.status(500).json({ message: error.message || 'Execution failed' });
    }
  }

  static async getRegistry(req: AuthRequest, res: Response) {
    try {
      const actions = RemediationRegistry.getAllowedActions();
      res.status(200).json(actions);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch registry' });
    }
  }
}
