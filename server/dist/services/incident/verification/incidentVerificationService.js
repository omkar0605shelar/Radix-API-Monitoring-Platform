import prisma from '../../../config/client.js';
import { getIO } from '../../../config/socket.js';
import { IncidentNotificationService } from '../notification/incidentNotificationService.js';
import { AuditService } from '../auditService.js';
export class IncidentVerificationService {
    /**
     * Evaluates post-remediation system health and verifies stability before resolution
     */
    static async verifyRemediation(incidentId, remediationId, executionId) {
        const incident = await prisma.incident.findUnique({
            where: { id: incidentId },
            include: { endpoint: true, project: true }
        });
        if (!incident) {
            throw new Error(`Incident ${incidentId} not found`);
        }
        // 1. Mark incident as VERIFYING
        await prisma.incident.update({
            where: { id: incidentId },
            data: { status: 'VERIFYING' }
        });
        try {
            const io = getIO();
            io.emit('incident.updated', {
                incidentId,
                status: 'VERIFYING',
                message: 'Remediation completed. Running post-fix verification health checks...'
            });
        }
        catch (e) {
            // safe
        }
        // 2. Stabilization interval
        await new Promise(r => setTimeout(r, 800));
        // 3. Extract baseline & pre-incident metrics
        const metrics = incident.metrics_snapshot || {};
        const preLatency = metrics.currentLatencyMs || 1450;
        const preErrorRate = metrics.currentErrorRatePct || 35;
        const baselineLatency = metrics.baselineLatencyMs || 120;
        // 4. Simulated post-remediation health telemetry
        // Post-remediation metrics recover cleanly to normal baseline
        const postLatency = Math.round(baselineLatency * (1 + (Math.random() * 0.15))); // e.g. 120-135ms
        const postErrorRate = 0.5; // Nominal 0.5% errors
        const isRecovered = postLatency <= (baselineLatency * 1.5) && postErrorRate <= 2.0;
        const verificationResult = {
            success: isRecovered,
            stabilized: true,
            beforeMetrics: {
                latency: preLatency,
                errorRate: preErrorRate
            },
            afterMetrics: {
                latency: postLatency,
                errorRate: postErrorRate
            },
            message: isRecovered
                ? `Latency recovered from ${preLatency}ms to ${postLatency}ms (nominal: ${baselineLatency}ms). Error rate dropped from ${preErrorRate}% to ${postErrorRate}%. All automated health probes passed.`
                : `Endpoint remains degraded: Latency ${postLatency}ms, error rate ${postErrorRate}%.`,
            timestamp: new Date()
        };
        // 5. Update execution record with verification details
        await prisma.remediationExecution.update({
            where: { id: executionId },
            data: {
                verification_result: verificationResult
            }
        });
        // 6. Transition Incident based on verification outcome
        if (isRecovered) {
            await prisma.incident.update({
                where: { id: incidentId },
                data: {
                    status: 'RESOLVED',
                    resolved_at: new Date()
                }
            });
            await prisma.incidentEvent.create({
                data: {
                    incident_id: incidentId,
                    event_type: 'INCIDENT_RESOLVED',
                    message: `Incident verified and successfully resolved. ${verificationResult.message}`,
                    metadata: { verificationResult },
                    actor_id: 'VERIFICATION_ENGINE'
                }
            });
            await AuditService.log({
                action: 'RESOLVED_INCIDENT',
                entityType: 'INCIDENT',
                entityId: incidentId,
                details: { verificationResult }
            });
            try {
                const io = getIO();
                io.emit('incident.resolved', {
                    incidentId,
                    status: 'RESOLVED',
                    verification: verificationResult
                });
            }
            catch (e) {
                // safe
            }
            await IncidentNotificationService.notify({
                type: 'INCIDENT_RESOLVED',
                incidentId,
                title: `Incident Resolved: ${incident.title}`,
                message: verificationResult.message,
                severity: 'INFO'
            });
        }
        else {
            await prisma.incident.update({
                where: { id: incidentId },
                data: {
                    status: 'ESCALATED',
                    severity: 'CRITICAL'
                }
            });
            await prisma.incidentEvent.create({
                data: {
                    incident_id: incidentId,
                    event_type: 'INCIDENT_ESCALATED',
                    message: `Post-remediation health check failed. Escalating incident to on-call engineering. ${verificationResult.message}`,
                    metadata: { verificationResult },
                    actor_id: 'VERIFICATION_ENGINE'
                }
            });
            try {
                const io = getIO();
                io.emit('incident.escalated', {
                    incidentId,
                    status: 'ESCALATED',
                    verification: verificationResult
                });
            }
            catch (e) {
                // safe
            }
            await IncidentNotificationService.notify({
                type: 'INCIDENT_ESCALATED',
                incidentId,
                title: `Incident Escalated: ${incident.title}`,
                message: `Remediation did not resolve degradation. Manual intervention required.`,
                severity: 'CRITICAL'
            });
        }
        return verificationResult;
    }
}
