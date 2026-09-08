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

  async delete(id: string, userId: string): Promise<any> {
    const project = await prisma.project.findFirst({
      where: { id, user_id: userId }
    });
    if (!project) return null;

    return prisma.$transaction(async (tx) => {
      const endpoints = await tx.endpoint.findMany({
        where: { project_id: id },
        select: { id: true }
      });
      const endpointIds = endpoints.map(e => e.id);

      if (endpointIds.length > 0) {
        await tx.requestHistory.deleteMany({
          where: { endpoint_id: { in: endpointIds } }
        });
        await tx.endpoint.deleteMany({
          where: { id: { in: endpointIds } }
        });
      }

      await tx.alert.deleteMany({ where: { project_id: id } });
      await tx.apiKey.deleteMany({ where: { project_id: id } });
      await tx.apiVersion.deleteMany({ where: { project_id: id } });
      await tx.usageRecord.deleteMany({ where: { project_id: id } });

      return tx.project.delete({
        where: { id }
      });
    });
  }
}
