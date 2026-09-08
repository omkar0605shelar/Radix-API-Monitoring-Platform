import OpenAI from 'openai';
/**
 * NVIDIA AI Provider (Llama 3.3 70B Instruct)
 */
export class NvidiaAIProvider {
    name = 'nvidia';
    client;
    model;
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.NVIDIA_API_KEY || 'mock_key',
            baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
        });
        this.model = process.env.AI_MODEL || process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct';
    }
    async analyzeIncident(context) {
        const startTime = Date.now();
        const prompt = `
You are an expert site reliability engineer (SRE) and backend systems architect diagnosing an API outage.

INCIDENT TELEMETRY CONTEXT:
- Endpoint: ${context.method || 'GET'} ${context.endpointPath || '/api'}
- Severity: ${context.severity}
- Current Latency: ${context.currentLatencyMs}ms (Baseline: ${context.baselineLatencyMs}ms)
- Current Error Rate: ${context.currentErrorRatePct}% (Baseline: ${context.baselineErrorRatePct}%)
- 5xx Server Errors: ${context.fiveXxCount}
- 4xx Client Errors: ${context.fourXxCount}
- Timeout Count: ${context.timeoutCount}
- Total Sample Requests: ${context.totalRequests}
- Recent Error Traces: ${JSON.stringify(context.recentErrors.slice(0, 5))}

Analyze the root cause and provide structured, deterministic recommendations.
Return STRICT JSON adhering to this exact schema (no markdown formatting outside json):

{
  "rootCause": "Clear, precise description of the underlying failure mechanism",
  "confidence": 0.92,
  "severity": "${context.severity}",
  "category": "DATABASE", // One of: DATABASE, NETWORK, AUTHENTICATION, AUTHORIZATION, APPLICATION, DEPENDENCY, RATE_LIMIT, INFRASTRUCTURE, PERFORMANCE, SECURITY, UNKNOWN
  "evidence": [
    "Evidence point 1 verifying the issue",
    "Evidence point 2 comparing current vs baseline",
    "Evidence point 3 from error patterns"
  ],
  "reasoning": "In-depth engineering reasoning explaining why this root cause occurred based on the symptoms.",
  "recommendedActions": [
    {
      "actionType": "increase_connection_pool", // Must be one of registered safe actions: clear_cache, increase_connection_pool, restart_service, rate_limit_throttle, circuit_breaker_trip, scale_service
      "title": "Increase Database Connection Pool & Clear Stale Connections",
      "description": "Expand database pool capacity to absorb pending connection requests",
      "reason": "Connection utilization exceeded limits causing queued requests to timeout",
      "risk": "MEDIUM", // LOW, MEDIUM, or HIGH
      "confidence": 0.90,
      "requiresApproval": true,
      "parameters": {}
    }
  ]
}
`;
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: 'You are an SRE incident response AI. Return only valid JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });
        const durationMs = Date.now() - startTime;
        const content = response.choices[0]?.message?.content || '{}';
        const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
            rootCause: parsed.rootCause || 'Unspecified anomaly detected in API service',
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
            severity: parsed.severity || context.severity,
            category: parsed.category || 'APPLICATION',
            evidence: Array.isArray(parsed.evidence) ? parsed.evidence : ['Unusual error spike observed'],
            reasoning: parsed.reasoning || 'Latency and error rate exceed standard baseline parameters.',
            recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
            model: this.model,
            provider: 'nvidia',
            durationMs
        };
    }
}
/**
 * Resilient Fallback / Rule-based SRE Provider
 * Used when external AI APIs are unreachable, ensuring 100% monitoring uptime
 */
export class FallbackAIProvider {
    name = 'fallback-heuristic';
    async analyzeIncident(context) {
        const startTime = Date.now();
        let category = 'APPLICATION';
        let rootCause = 'Elevated latency and API error degradation';
        let reasoning = 'Statistical baseline exceeded nominal operating thresholds.';
        const evidence = [
            `Latency rose from ${context.baselineLatencyMs}ms to ${context.currentLatencyMs}ms (+${Math.round(((context.currentLatencyMs - context.baselineLatencyMs) / (context.baselineLatencyMs || 1)) * 100)}%)`,
            `Error rate reached ${context.currentErrorRatePct}% (baseline: ${context.baselineErrorRatePct}%)`,
            `${context.fiveXxCount} 5xx server errors and ${context.timeoutCount} request timeouts detected`
        ];
        const actions = [];
        // Database connection exhaustion signature
        if (context.timeoutCount > 0 && context.currentLatencyMs >= 800) {
            category = 'DATABASE';
            rootCause = 'Database connection pool exhaustion and query timeouts';
            reasoning = 'The high timeout rate accompanied by severe latency degradation indicates incoming requests are queuing for database connections until socket timeouts occur.';
            evidence.push('Symptom signature matches database connection saturation');
            actions.push({
                actionType: 'increase_connection_pool',
                title: 'Increase Database Connection Pool',
                description: 'Expand active connection pool limits and clear idle connections',
                reason: 'Current connection pool capacity is saturated by concurrent query volume',
                risk: 'MEDIUM',
                confidence: 0.91,
                requiresApproval: true,
                parameters: { targetPoolSize: 40 }
            });
            actions.push({
                actionType: 'restart_service',
                title: 'Gracefully Restart Service Pod',
                description: 'Bounce affected backend instance to flush leaked connections',
                reason: 'Clear orphaned client connections and restore clean pool state',
                risk: 'HIGH',
                confidence: 0.85,
                requiresApproval: true
            });
        }
        else if (context.currentLatencyMs > context.baselineLatencyMs * 2) {
            category = 'PERFORMANCE';
            rootCause = 'Memory pressure and un-cached response bottlenecks';
            reasoning = 'Response latency shows consistent degradation typical of hot memory cache misses or unindexed queries.';
            actions.push({
                actionType: 'clear_cache',
                title: 'Purge & Warm In-Memory Redis Cache',
                description: 'Flush corrupted/stale cache partitions to re-establish clean cached objects',
                reason: 'Eliminate stale key locks and restore sub-millisecond retrieval',
                risk: 'LOW',
                confidence: 0.88,
                requiresApproval: false
            });
        }
        else {
            category = 'APPLICATION';
            rootCause = 'Unhandled upstream exception spike';
            reasoning = 'Multiple 500 status returns detected during high volume operations.';
            actions.push({
                actionType: 'restart_service',
                title: 'Restart Affected Service Instance',
                description: 'Restart container process to clear corrupt internal memory state',
                reason: 'Restore nominal runtime execution',
                risk: 'MEDIUM',
                confidence: 0.82,
                requiresApproval: true
            });
        }
        return {
            rootCause,
            confidence: 0.90,
            severity: context.severity,
            category,
            evidence,
            reasoning,
            recommendedActions: actions,
            model: 'heuristic-rule-engine-v2',
            provider: 'fallback-heuristic',
            durationMs: Date.now() - startTime
        };
    }
}
/**
 * Provider Router with automatic graceful fallback
 */
export class AIProviderFactory {
    static async getProvider() {
        if (process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY !== 'mock_key') {
            return new NvidiaAIProvider();
        }
        return new FallbackAIProvider();
    }
}
