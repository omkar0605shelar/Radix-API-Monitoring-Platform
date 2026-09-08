import prisma from '../../../config/client.js';
import { IncidentSeverityType } from '../types.js';

interface CorrelatedAlert {
  projectId: string;
  endpointId?: string;
  alertType: string;
  threshold: number;
  observedValue: number;
  timestamp: Date;
}

export class AlertCorrelationEngine {
  private static recentAlerts: CorrelatedAlert[] = [];
  private static readonly CORRELATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Evaluates an incoming alert to see if it should correlate to an existing open incident
   */
  static async correlateAlert(alert: CorrelatedAlert): Promise<{
    shouldCreateIncident: boolean;
    existingIncidentId?: string;
    correlatedAlertCount: number;
  }> {
    const now = Date.now();
    
    // Purge alerts older than window
    this.recentAlerts = this.recentAlerts.filter(
      a => now - a.timestamp.getTime() <= this.CORRELATION_WINDOW_MS
    );
    this.recentAlerts.push(alert);

    // Count related alerts for this project/endpoint
    const correlated = this.recentAlerts.filter(
      a => a.projectId === alert.projectId && 
           (a.endpointId === alert.endpointId || !alert.endpointId)
    );

    // Check if an active/open incident already exists for this endpoint/project
    try {
      const activeIncident = await prisma.incident.findFirst({
        where: {
          project_id: alert.projectId,
          endpoint_id: alert.endpointId || undefined,
          status: {
            in: ['OPEN', 'INVESTIGATING', 'AI_ANALYZING', 'REMEDIATION_PENDING', 'AWAITING_APPROVAL', 'REMEDIATING', 'VERIFYING']
          }
        },
        orderBy: { created_at: 'desc' }
      });

      if (activeIncident) {
        // Record an event on the existing incident to record alert aggregation
        await prisma.incidentEvent.create({
          data: {
            incident_id: activeIncident.id,
            event_type: 'ALERT_CORRELATED',
            message: `Correlated threshold alert: ${alert.alertType} (observed: ${alert.observedValue}, threshold: ${alert.threshold}). Total alerts in window: ${correlated.length}`,
            metadata: {
              alertType: alert.alertType,
              observed: alert.observedValue,
              threshold: alert.threshold,
              windowCount: correlated.length
            },
            actor_id: 'CORRELATION_ENGINE'
          }
        });

        return {
          shouldCreateIncident: false,
          existingIncidentId: activeIncident.id,
          correlatedAlertCount: correlated.length
        };
      }
    } catch (e) {
      console.warn('[AlertCorrelationEngine] DB check failed, proceeding safely:', e);
    }

    return {
      shouldCreateIncident: true,
      correlatedAlertCount: correlated.length
    };
  }
}
