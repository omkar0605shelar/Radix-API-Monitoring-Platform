import prisma from '../config/client.js';

export class ProjectRepository {
  async create(userId: string, repositoryUrl: string, name: string): Promise<any> {
    return prisma.project.create({
      data: {
        user_id: userId,
        repository_url: repositoryUrl,
        name: name,
        status: 'pending'
      }
    });
  }

  async findByUserId(userId: string): Promise<any[]> {
    return prisma.project.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
  }

  async findById(id: string, userId: string): Promise<any | null> {
    return prisma.project.findUnique({
      where: { id, user_id: userId }
    });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await prisma.project.update({
      where: { id },
      data: { status }
    });
  }
}
