import prisma from '../../config/client.js';

export interface AuditLogInput {
  userId?: string;
  action: string;
  entityType: 'INCIDENT' | 'REMEDIATION' | 'SYSTEM';
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export class AuditService {
  /**
   * Records an immutable audit log entry for compliance and security
   */
  static async log(entry: AuditLogInput) {
    try {
      return await prisma.auditLog.create({
        data: {
          user_id: entry.userId || null,
          action: entry.action,
          entity_type: entry.entityType,
          entity_id: entry.entityId,
          details: entry.details || {},
          ip_address: entry.ipAddress || '127.0.0.1'
        }
      });
    } catch (e: any) {
      console.error('[AuditService] Failed to write audit record:', e.message);
      return null;
    }
  }

  /**
   * Query recent audit records with filtering
   */
  static async getLogs(entityType?: string, entityId?: string, limit: number = 50) {
    return prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entity_type: entityType } : {}),
        ...(entityId ? { entity_id: entityId } : {})
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });
  }
}
