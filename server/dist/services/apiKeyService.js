import crypto from 'crypto';
import prisma from '../config/client.js';
export class ApiKeyService {
    /**
     * Generates a new unique API key for a project.
     */
    async generateKey(projectId, name) {
        const key = `ak_${crypto.randomBytes(24).toString('hex')}`;
        return prisma.apiKey.create({
            data: {
                key,
                name,
                project_id: projectId,
            },
        });
    }
    /**
     * Validates an API key and returns the associated project.
     */
    async validateKey(key) {
        const apiKey = await prisma.apiKey.findUnique({
            where: { key },
            include: { project: true },
        });
        if (!apiKey)
            return null;
        // Update last used timestamp
        await prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { last_used: new Date() },
        });
        return apiKey.project;
    }
    /**
     * Revokes (deletes) an API key.
     */
    async revokeKey(id) {
        return prisma.apiKey.delete({
            where: { id },
        });
    }
    /**
     * Lists all API keys for a project.
     */
    async listKeys(projectId) {
        return prisma.apiKey.findMany({
            where: { project_id: projectId },
            orderBy: { created_at: 'desc' },
        });
    }
}
