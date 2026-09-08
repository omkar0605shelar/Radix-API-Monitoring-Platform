import prisma from '../../../config/client.js';
import { getIO } from '../../../config/socket.js';
import { RemediationExecutor } from './remediationExecutor.js';
import { AuditService } from '../auditService.js';
export class RemediationService {
    /**
     * Approves a remediation action and triggers safe execution
     */
    static async approveRemediation(remediationId, userId, reason = 'Approved by engineer after review') {
        const action = await prisma.remediationAction.findUnique({
            where: { id: remediationId },
            include: {
                incident: {
                    include: {
                        project: {
                            include: {
                                team: {
                                    include: { members: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!action) {
            throw new Error(`Remediation action ${remediationId} not found`);
        }
        // Role-based authorization check
        const project = action.incident.project;
        if (project.team_id && project.team) {
            const membership = project.team.members.find((m) => m.user_id === userId);
            if (!membership || membership.role === 'VIEWER') {
                throw new Error('Forbidden: Viewer role cannot approve remediation actions.');
            }
        }
        else if (project.user_id !== userId) {
            // Personal project check
            throw new Error('Forbidden: Only project owner or team admin/members can approve remediations.');
        }
        // 1. Record approval in DB
        const approval = await prisma.remediationApproval.create({
            data: {
                remediation_id: remediationId,
                user_id: userId,
                status: 'APPROVED',
                reason
            }
        });
        // 2. Update action status
        await prisma.remediationAction.update({
            where: { id: remediationId },
            data: { status: 'APPROVED' }
        });
        // 3. Record timeline event
        await prisma.incidentEvent.create({
            data: {
                incident_id: action.incident_id,
                event_type: 'REMEDIATION_APPROVED',
                message: `Remediation action "${action.title}" approved by user. Reason: "${reason}". Execution starting...`,
                metadata: { remediationId, approvalId: approval.id },
                actor_id: userId
            }
        });
        await AuditService.log({
            userId,
            action: 'APPROVE_REMEDIATION',
            entityType: 'REMEDIATION',
            entityId: remediationId,
            details: { reason }
        });
        try {
            const io = getIO();
            io.emit('incident.remediation.approved', {
                incidentId: action.incident_id,
                remediationId,
                userId
            });
        }
        catch (e) {
            // safe
        }
        // 4. Trigger execution
        return RemediationExecutor.executeAction(remediationId, userId);
    }
    /**
     * Rejects a remediation recommendation with justification
     */
    static async rejectRemediation(remediationId, userId, reason) {
        const action = await prisma.remediationAction.findUnique({
            where: { id: remediationId }
        });
        if (!action) {
            throw new Error(`Remediation action ${remediationId} not found`);
        }
        await prisma.remediationApproval.create({
            data: {
                remediation_id: remediationId,
                user_id: userId,
                status: 'REJECTED',
                reason
            }
        });
        await prisma.remediationAction.update({
            where: { id: remediationId },
            data: { status: 'REJECTED' }
        });
        await prisma.incidentEvent.create({
            data: {
                incident_id: action.incident_id,
                event_type: 'REMEDIATION_REJECTED',
                message: `Remediation action "${action.title}" rejected. Reason: "${reason}".`,
                metadata: { remediationId, reason },
                actor_id: userId
            }
        });
        await AuditService.log({
            userId,
            action: 'REJECT_REMEDIATION',
            entityType: 'REMEDIATION',
            entityId: remediationId,
            details: { reason }
        });
        return { status: 'REJECTED', remediationId };
    }
}
