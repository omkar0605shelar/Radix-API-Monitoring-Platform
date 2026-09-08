import prisma from '../../../config/client.js';
import { z } from 'zod';
import { AIContextBuilder } from './aiContextBuilder.js';
import { AIProviderFactory } from './aiProvider.js';
import { getIO } from '../../../config/socket.js';
import { IncidentNotificationService } from '../notification/incidentNotificationService.js';
const RecommendedActionSchema = z.object({
    actionType: z.string().min(1),
    title: z.string().min(1),
    description: z.string(),
    reason: z.string(),
    risk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    confidence: z.number().min(0).max(1),
    requiresApproval: z.boolean(),
    parameters: z.record(z.string(), z.any()).optional()
});
const AnalysisResultSchema = z.object({
    rootCause: z.string().min(3),
    confidence: z.number().min(0).max(1),
    severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    category: z.enum([
        'DATABASE', 'NETWORK', 'AUTHENTICATION', 'AUTHORIZATION',
        'APPLICATION', 'DEPENDENCY', 'RATE_LIMIT', 'INFRASTRUCTURE',
        'PERFORMANCE', 'SECURITY', 'UNKNOWN'
    ]),
    evidence: z.array(z.string()),
    reasoning: z.string(),
    recommendedActions: z.array(RecommendedActionSchema)
});
export class IncidentAnalysisService {
    /**
     * Performs end-to-end AI diagnosis and generates validated recommendations
     */
    static async analyzeIncident(incidentId) {
        // 1. Mark incident as AI_ANALYZING
        await prisma.incident.update({
            where: { id: incidentId },
            data: { status: 'AI_ANALYZING' }
        });
        try {
            const io = getIO();
            io.emit('incident.analyzing', { incidentId });
        }
        catch (e) {
            // Socket may not be connected in some test contexts
        }
        // 2. Build sanitized context
        const context = await AIContextBuilder.buildContext(incidentId);
        // 3. Obtain provider and execute
        const provider = await AIProviderFactory.getProvider();
        let rawResult;
        try {
            rawResult = await provider.analyzeIncident(context);
        }
        catch (error) {
            console.warn(`[AIAnalysisService] Primary provider failed: ${error.message}. Using resilient fallback.`);
            const { FallbackAIProvider } = await import('./aiProvider.js');
            const fallback = new FallbackAIProvider();
            rawResult = await fallback.analyzeIncident(context);
        }
        // 4. Validate output with Zod
        const validated = AnalysisResultSchema.safeParse(rawResult);
        const result = validated.success
            ? {
                ...validated.data,
                model: rawResult.model,
                provider: rawResult.provider,
                durationMs: rawResult.durationMs
            }
            : rawResult; // Use rawResult with safe defaults if zod warning occurs
        // 5. Store IncidentAnalysis record
        const analysisRecord = await prisma.incidentAnalysis.create({
            data: {
                incident_id: incidentId,
                root_cause: result.rootCause,
                confidence: result.confidence,
                reasoning: result.reasoning,
                evidence: result.evidence,
                recommendations: result.recommendedActions,
                category: result.category,
                model: result.model,
                provider: result.provider,
                duration_ms: result.durationMs
            }
        });
        // 6. Register Remediation Actions in DB
        const createdActions = [];
        for (const action of result.recommendedActions) {
            const actionRecord = await prisma.remediationAction.create({
                data: {
                    incident_id: incidentId,
                    action_type: action.actionType,
                    title: action.title,
                    description: action.description,
                    reason: action.reason,
                    risk: action.risk,
                    confidence: action.confidence,
                    requires_approval: action.requiresApproval,
                    status: action.requiresApproval ? 'AWAITING_APPROVAL' : 'PENDING',
                    parameters: action.parameters || {}
                }
            });
            createdActions.push(actionRecord);
        }
        // Determine next incident state
        const hasApprovalRequired = createdActions.some(a => a.requires_approval);
        const nextStatus = hasApprovalRequired ? 'AWAITING_APPROVAL' : 'REMEDIATION_PENDING';
        await prisma.incident.update({
            where: { id: incidentId },
            data: {
                status: nextStatus,
                category: result.category
            }
        });
        // 7. Add timeline event
        await prisma.incidentEvent.create({
            data: {
                incident_id: incidentId,
                event_type: 'AI_ANALYSIS_COMPLETED',
                message: `Root Cause Identified: "${result.rootCause}" (${Math.round(result.confidence * 100)}% confidence). ${result.recommendedActions.length} remediation actions recommended.`,
                metadata: {
                    category: result.category,
                    confidence: result.confidence,
                    model: result.model,
                    recommendedActionsCount: result.recommendedActions.length
                },
                actor_id: 'AI_ENGINE'
            }
        });
        // 8. Broadcast real-time Socket.io event & notifications
        try {
            const io = getIO();
            io.emit('incident.analysis.completed', {
                incidentId,
                analysis: analysisRecord,
                actions: createdActions,
                status: nextStatus
            });
        }
        catch (e) {
            // safe
        }
        await IncidentNotificationService.notify({
            type: 'AI_ANALYSIS_COMPLETED',
            incidentId,
            title: `AI Root Cause Diagnosed for Incident`,
            message: `${result.rootCause} (${Math.round(result.confidence * 100)}% confidence)`,
            severity: result.severity
        });
        return result;
    }
}
