import { EndpointRepository } from '../repositories/endpointRepository.js';
import { ProjectRepository } from '../repositories/projectRepository.js';
import redisClient from '../config/redis.js';

const endpointRepository = new EndpointRepository();
const projectRepository = new ProjectRepository();

export class EndpointService {
  async getProjectEndpoints(projectId: string, userId: string): Promise<any[]> {
    // 1. Validate user has access to project
    const project = await projectRepository.findById(projectId, userId);
    if (!project) {
      const error = new Error('Project not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // 2. Check Redis Cache safely (fail fast if Redis is idle/offline)
    const cacheKey = `endpoints:${projectId}`;
    if (redisClient.isOpen && redisClient.isReady) {
      try {
        const cached = await Promise.race([
          redisClient.get(cacheKey),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 800))
        ]);
        if (cached) {
          return JSON.parse(cached as string);
        }
      } catch (err) {
        // Fallback directly to PostgreSQL below
      }
    }

    // 3. Get from DB
    const endpoints = await endpointRepository.findByProjectId(projectId);

    // 4. Save to Cache ONLY if project is completed (expire in 1 hour)
    if (redisClient.isOpen && redisClient.isReady && project.status === 'completed') {
      try {
        await Promise.race([
          redisClient.setEx(cacheKey, 3600, JSON.stringify(endpoints)),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 800))
        ]);
      } catch (err) {
        // Silent handling of cache write failures
      }
    }

    return endpoints;
  }
}
