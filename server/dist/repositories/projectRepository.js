import prisma from '../config/client.js';
export class ProjectRepository {
    async create(userId, repositoryUrl, name) {
        return prisma.project.create({
            data: {
                user_id: userId,
                repository_url: repositoryUrl,
                name: name,
                status: 'pending'
            }
        });
    }
    async findByUserId(userId) {
        return prisma.project.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' }
        });
    }
    async findById(id, userId) {
        return prisma.project.findUnique({
            where: { id, user_id: userId }
        });
    }
    async updateStatus(id, status) {
        await prisma.project.update({
            where: { id },
            data: { status }
        });
    }
}
