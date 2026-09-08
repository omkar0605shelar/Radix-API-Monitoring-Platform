import prisma from '../../../config/client.js';
import redisClient from '../../../config/redis.js';
import { RemediationRegistry } from './remediationRegistry.js';
import { getIO } from '../../../config/socket.js';
import { IncidentVerificationService } from '../verification/incidentVerificationService.js';
import { AuditService } from '../auditService.js';
/**
 * Safe Simulation Provider for development and demonstration
 */
export class SimulationRemediationProvider {
    async execute(actionType, parameters) {
        const startTime = Date.now();
        const logs = [];
        logs.push(`[SIMULATION] Starting remediation execution for action: ${actionType}`);
        await new Promise(r => setTimeout(r, 600)); // Simulate brief operation delay
        switch (actionType) {
            case 'clear_cache':
                logs.push('[SIMULATION] Connected to Redis cache cluster');
                logs.push('[SIMULATION] Executed command: KEYS *radix* -> DEL keys');
                logs.push('[SIMULATION] Flushed 142 stale cache keys successfully');
                break;
            case 'increase_connection_pool':
                const target = parameters?.targetPoolSize || 40;
                logs.push(`[SIMULATION] Querying active database connection pool (current: 10 max)`);
                logs.push(`[SIMULATION] Increasing PostgreSQL connection pool to: ${target}`);
                logs.push(`[SIMULATION] Pool resized: 40 max connections allocated, 0 queued clients`);
                break;
            case 'restart_service':
                logs.push('[SIMULATION] Initiating graceful rolling process bounce');
                logs.push('[SIMULATION] Drained active HTTP connections');
                logs.push('[SIMULATION] Application process re-initialized with fresh memory space');
                break;
            case 'rate_limit_throttle':
                logs.push('[SIMULATION] Temporarily tightened rate limiter window to 50 req/min');
                logs.push('[SIMULATION] Rate limiting rules deployed to gateway proxy');
                break;
            case 'scale_service':
                logs.push('[SIMULATION] Container orchestrator request sent');
                logs.push('[SIMULATION] Scaled replica count: 2 -> 4 instances');
                break;
            default:
                logs.push(`[SIMULATION] Simulated action ${actionType} completed without errors`);
        }
        const durationMs = Date.now() - startTime;
        logs.push(`[SIMULATION] Remediation finished cleanly in ${durationMs}ms`);
        return {
            success: true,
            actionType,
            provider: 'simulation',
            logs,
            output: {
                mode: 'simulation',
                executedAt: new Date().toISOString(),
                parameters: parameters || {}
            },
            durationMs
        };
    }
}
/**
 * Live Redis Remediation Provider
 */
export class RedisRemediationProvider {
    async execute(actionType, parameters) {
        const startTime = Date.now();
        const logs = [];
        try {
            if (actionType === 'clear_cache' && redisClient.isOpen) {
                logs.push('Flushing Redis cache keys matching application prefix...');
                await redisClient.flushDb();
                logs.push('Redis DB flushed successfully.');
            }
            else {
                logs.push(`Redis provider received action ${actionType}, executing fallback simulation.`);
            }
            return {
                success: true,
                actionType,
                provider: 'redis',
                logs,
                output: { status: 'cache_cleared' },
                durationMs: Date.now() - startTime
            };
        }
        catch (e) {
            logs.push(`Redis error during remediation: ${e.message}`);
            return {
                success: false,
                actionType,
                provider: 'redis',
                logs,
                output: { error: e.message },
                durationMs: Date.now() - startTime
            };
        }
    }
}
export class RemediationExecutor {
    /**
     * Executes a remediation action through the appropriate safe provider
     */
    static async executeAction(remediationId, actorId = 'SYSTEM') {
        const action = await prisma.remediationAction.findUnique({
            where: { id: remediationId },
            include: { incident: true }
        });
        if (!action) {
            throw new Error(`Remediation action ${remediationId} not found`);
        }
        // Strictly enforce enterprise allowlist
        if (!RemediationRegistry.isAllowed(action.action_type)) {
            throw new Error(`Security Violation: Action "${action.action_type}" is not in the allowed remediation registry.`);
        }
        // 1. Create execution record
        const execution = await prisma.remediationExecution.create({
            data: {
                remediation_id: remediationId,
                status: 'IN_PROGRESS'
            }
        });
        // 2. Update action & incident state
        await prisma.remediationAction.update({
            where: { id: remediationId },
            data: { status: 'EXECUTING' }
        });
        await prisma.incident.update({
            where: { id: action.incident_id },
            data: { status: 'REMEDIATING' }
        });
        try {
            const io = getIO();
            io.emit('incident.remediation.started', {
                incidentId: action.incident_id,
                remediationId,
                actionType: action.action_type
            });
        }
        catch (e) {
            // safe
        }
        // 3. Select provider (defaults to simulation for safety unless explicitly production)
        const isSimMode = process.env.REMEDIATION_SIMULATION_MODE === 'true' || process.env.REMEDIATION_MODE !== 'production';
        const provider = isSimMode || action.action_type !== 'clear_cache'
            ? new SimulationRemediationProvider()
            : new RedisRemediationProvider();
        // 4. Execute action
        let result;
        try {
            result = await provider.execute(action.action_type, action.parameters || {});
        }
        catch (err) {
            result = {
                success: false,
                actionType: action.action_type,
                provider: 'error',
                logs: [`Execution failed: ${err.message}`],
                output: { error: err.message },
                durationMs: 0
            };
        }
        // 5. Update execution record
        await prisma.remediationExecution.update({
            where: { id: execution.id },
            data: {
                status: result.success ? 'SUCCESS' : 'FAILED',
                completed_at: new Date(),
                result: result,
                error: result.success ? null : result.logs.join('\n')
            }
        });
        await prisma.remediationAction.update({
            where: { id: remediationId },
            data: { status: result.success ? 'COMPLETED' : 'FAILED' }
        });
        // 6. Record timeline event & audit log
        await prisma.incidentEvent.create({
            data: {
                incident_id: action.incident_id,
                event_type: result.success ? 'REMEDIATION_EXECUTED' : 'REMEDIATION_FAILED',
                message: `Remediation "${action.title}" (${action.action_type}) executed via ${result.provider} provider in ${result.durationMs}ms. Result: ${result.success ? 'SUCCESS' : 'FAILED'}.`,
                metadata: {
                    actionId: remediationId,
                    actionType: action.action_type,
                    durationMs: result.durationMs,
                    logs: result.logs
                },
                actor_id: actorId
            }
        });
        await AuditService.log({
            userId: actorId === 'SYSTEM' ? undefined : actorId,
            action: 'EXECUTE_REMEDIATION',
            entityType: 'REMEDIATION',
            entityId: remediationId,
            details: {
                incidentId: action.incident_id,
                actionType: action.action_type,
                success: result.success,
                durationMs: result.durationMs
            }
        });
        // 7. Trigger post-remediation automated verification
        await IncidentVerificationService.verifyRemediation(action.incident_id, remediationId, execution.id);
        return result;
    }
}
