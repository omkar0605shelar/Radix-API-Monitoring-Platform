import prisma from '../../../config/client.js';
export class AIContextBuilder {
    /**
     * Builds an optimized, token-efficient SRE diagnostic context for an incident
     */
    static async buildContext(incidentId) {
        const incident = await prisma.incident.findUnique({
            where: { id: incidentId },
            include: {
                endpoint: true,
                project: true
            }
        });
        if (!incident) {
            throw new Error(`Incident ${incidentId} not found`);
        }
        const metrics = incident.metrics_snapshot || {};
        // Gather recent failure traces for this endpoint
        let recentErrors = [];
        if (incident.endpoint_id) {
            try {
                const errorLogs = await prisma.requestHistory.findMany({
                    where: {
                        endpoint_id: incident.endpoint_id,
                        status: { gte: 400 }
                    },
                    orderBy: { created_at: 'desc' },
                    take: 5,
                    select: {
                        status: true,
                        duration: true,
                        response: true,
                        created_at: true
                    }
                });
                recentErrors = errorLogs.map((log) => {
                    const respStr = typeof log.response === 'object' ? JSON.stringify(log.response) : String(log.response || '');
                    // Sanitize potential secret tokens
                    const sanitized = respStr.replace(/(bearer|token|password|secret|key)[\s:=]+["']?[a-zA-Z0-9_\-\.]+["']?/gi, '$1: [REDACTED]');
                    return `Status ${log.status} (${log.duration}ms): ${sanitized.slice(0, 150)}`;
                });
            }
            catch (e) {
                // Safe fallback
            }
        }
        return {
            incidentId: incident.id,
            title: incident.title,
            severity: incident.severity,
            endpointPath: incident.endpoint?.path || '/api',
            method: incident.endpoint?.method || 'GET',
            currentLatencyMs: metrics.currentLatencyMs || 120,
            baselineLatencyMs: metrics.baselineLatencyMs || 100,
            currentErrorRatePct: metrics.currentErrorRatePct || 0,
            baselineErrorRatePct: metrics.baselineErrorRatePct || 0,
            fiveXxCount: metrics.fiveXxCount || 0,
            fourXxCount: metrics.fourXxCount || 0,
            timeoutCount: metrics.timeoutCount || 0,
            totalRequests: metrics.totalRequests || 10,
            recentErrors
        };
    }
}
