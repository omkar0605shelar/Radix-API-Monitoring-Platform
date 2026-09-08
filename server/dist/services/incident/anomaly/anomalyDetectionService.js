import prisma from '../../../config/client.js';
import { SeverityEngine } from './severityEngine.js';
export class AnomalyDetectionService {
    static bufferMap = new Map();
    static MAX_BUFFER_SIZE = 50;
    /**
     * Record a single telemetry point and evaluate for anomalies
     */
    static recordTelemetry(point) {
        const key = point.endpointId || `${point.projectId}:${point.endpointPath}:${point.method}`;
        let buffer = this.bufferMap.get(key);
        if (!buffer) {
            buffer = {
                latencies: [],
                statuses: [],
                timeouts: [],
                lastUpdated: Date.now()
            };
            this.bufferMap.set(key, buffer);
        }
        buffer.latencies.push(point.duration);
        buffer.statuses.push(point.status);
        buffer.timeouts.push(point.isTimeout ? 1 : 0);
        buffer.lastUpdated = Date.now();
        if (buffer.latencies.length > this.MAX_BUFFER_SIZE) {
            buffer.latencies.shift();
            buffer.statuses.shift();
            buffer.timeouts.shift();
        }
    }
    /**
     * Statistical baseline calculation using RequestHistory or in-memory telemetry
     */
    static async evaluateEndpoint(projectId, endpointId, overrideCurrent) {
        const key = endpointId || `${projectId}:global`;
        const buffer = this.bufferMap.get(key);
        let baselineLatency = 120; // Default nominal ms
        let baselineErrorRate = 1.0; // Default nominal 1%
        // Query historical averages from RequestHistory
        try {
            if (endpointId) {
                const historyRecords = await prisma.requestHistory.findMany({
                    where: { endpoint_id: endpointId },
                    orderBy: { created_at: 'desc' },
                    take: 50,
                    select: { duration: true, status: true }
                });
                if (historyRecords.length >= 5) {
                    const totalDuration = historyRecords.reduce((acc, r) => acc + r.duration, 0);
                    baselineLatency = Math.round(totalDuration / historyRecords.length);
                    const errors = historyRecords.filter((r) => r.status >= 400).length;
                    baselineErrorRate = Math.max(0.5, (errors / historyRecords.length) * 100);
                }
            }
        }
        catch (e) {
            // Fallback to defaults if db query encounters error
        }
        // Determine current metrics
        let currentLatency = baselineLatency;
        let currentErrorRate = baselineErrorRate;
        let fiveXx = 0;
        let fourXx = 0;
        let timeouts = 0;
        let totalReqs = 10;
        if (overrideCurrent) {
            currentLatency = overrideCurrent.latency;
            currentErrorRate = overrideCurrent.errorRate;
            totalReqs = 20;
            fiveXx = Math.round((currentErrorRate / 100) * totalReqs);
            timeouts = Math.round((overrideCurrent.timeoutRate / 100) * totalReqs);
        }
        else if (buffer && buffer.latencies.length >= 3) {
            const recentLatencies = buffer.latencies.slice(-10);
            const recentStatuses = buffer.statuses.slice(-10);
            const recentTimeouts = buffer.timeouts.slice(-10);
            currentLatency = Math.round(recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length);
            totalReqs = recentStatuses.length;
            fiveXx = recentStatuses.filter(s => s >= 500).length;
            fourXx = recentStatuses.filter(s => s >= 400 && s < 500).length;
            timeouts = recentTimeouts.reduce((a, b) => a + b, 0);
            currentErrorRate = totalReqs > 0 ? ((fiveXx + fourXx) / totalReqs) * 100 : 0;
        }
        const latencyDeviationPct = baselineLatency > 0
            ? Math.max(0, ((currentLatency - baselineLatency) / baselineLatency) * 100)
            : 0;
        const metrics = {
            currentLatencyMs: currentLatency,
            baselineLatencyMs: baselineLatency,
            latencyDeviationPct: Math.round(latencyDeviationPct),
            currentErrorRatePct: Math.round(currentErrorRate * 10) / 10,
            baselineErrorRatePct: Math.round(baselineErrorRate * 10) / 10,
            fiveXxCount: fiveXx,
            fourXxCount: fourXx,
            timeoutCount: timeouts,
            totalRequests: totalReqs,
            sampleWindowSeconds: 60
        };
        const severityEvaluation = SeverityEngine.calculateSeverity(metrics);
        const hasAnomaly = severityEvaluation.severity === 'CRITICAL' ||
            severityEvaluation.severity === 'HIGH' ||
            severityEvaluation.severity === 'MEDIUM';
        return {
            hasAnomaly,
            severity: severityEvaluation.severity,
            primaryReason: severityEvaluation.primaryReason,
            reasons: severityEvaluation.reasons,
            metrics
        };
    }
}
