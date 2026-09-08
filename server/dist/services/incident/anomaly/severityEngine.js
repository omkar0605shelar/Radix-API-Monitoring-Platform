export class SeverityEngine {
    /**
     * Evaluates multi-factor incident severity deterministically
     * - Error percentage (5xx vs 4xx)
     * - Latency percentage deviation over baseline
     * - Timeout frequency
     * - Request volume and impact
     */
    static calculateSeverity(metrics) {
        const reasons = [];
        let severity = 'INFO';
        const { currentLatencyMs, baselineLatencyMs, latencyDeviationPct, currentErrorRatePct, fiveXxCount, timeoutCount, totalRequests } = metrics;
        const fiveXxRatePct = totalRequests > 0 ? (fiveXxCount / totalRequests) * 100 : 0;
        const timeoutRatePct = totalRequests > 0 ? (timeoutCount / totalRequests) * 100 : 0;
        // 1. Extreme Critical Conditions
        if (fiveXxRatePct >= 30 || currentErrorRatePct >= 50) {
            severity = 'CRITICAL';
            reasons.push(`Critical error spike: ${fiveXxRatePct.toFixed(1)}% 5xx server errors.`);
        }
        if (latencyDeviationPct >= 300 && currentLatencyMs >= 1000) {
            severity = 'CRITICAL';
            reasons.push(`Severe latency degradation: ${currentLatencyMs}ms (${latencyDeviationPct.toFixed(0)}% above baseline).`);
        }
        if (timeoutRatePct >= 15) {
            severity = 'CRITICAL';
            reasons.push(`Critical timeout rate: ${timeoutRatePct.toFixed(1)}% of requests timed out.`);
        }
        // 2. High Severity Conditions
        if (severity !== 'CRITICAL') {
            if (fiveXxRatePct >= 10 || currentErrorRatePct >= 20) {
                severity = 'HIGH';
                reasons.push(`High error rate: ${currentErrorRatePct.toFixed(1)}% failures detected.`);
            }
            else if (latencyDeviationPct >= 100 && currentLatencyMs >= 600) {
                severity = 'HIGH';
                reasons.push(`High latency increase: ${currentLatencyMs}ms (2x baseline).`);
            }
            else if (timeoutRatePct >= 5) {
                severity = 'HIGH';
                reasons.push(`Elevated timeout rate: ${timeoutRatePct.toFixed(1)}% timeouts.`);
            }
        }
        // 3. Medium Severity Conditions
        if (severity !== 'CRITICAL' && severity !== 'HIGH') {
            if (currentErrorRatePct >= 5 || latencyDeviationPct >= 50) {
                severity = 'MEDIUM';
                reasons.push(`Noticeable performance degradation: latency +${latencyDeviationPct.toFixed(0)}%, error rate ${currentErrorRatePct.toFixed(1)}%.`);
            }
        }
        // 4. Low Severity Conditions
        if (severity === 'INFO') {
            if (latencyDeviationPct >= 20 || currentErrorRatePct >= 2) {
                severity = 'LOW';
                reasons.push(`Mild metric drift detected: latency +${latencyDeviationPct.toFixed(0)}%.`);
            }
        }
        const primaryReason = reasons.length > 0
            ? reasons[0]
            : `Telemetry nominal (latency: ${currentLatencyMs}ms, error: ${currentErrorRatePct}%)`;
        return {
            severity,
            reasons,
            primaryReason
        };
    }
}
