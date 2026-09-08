import { EndpointRepository } from '../repositories/endpointRepository.js';
import { ProjectRepository } from '../repositories/projectRepository.js';
import redisClient from '../config/redis.js';
const endpointRepository = new EndpointRepository();
const projectRepository = new ProjectRepository();
export class EndpointService {
    async getProjectEndpoints(projectId, userId) {
        // 1. Validate user has access to project
        const project = await projectRepository.findById(projectId, userId);
        if (!project) {
            const error = new Error('Project not found');
            error.statusCode = 404;
            throw error;
        }
        // 2. Check Redis Cache
        const cacheKey = `endpoints:${projectId}`;
        if (redisClient.isOpen) {
            try {
                const cached = await redisClient.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            }
            catch (err) {
                // Silent fallback: Upstash/Serverless Redis often closes idle sockets.
                // The DB fallback below ensures the request still succeeds.
            }
        }
        // 3. Get from DB
        const endpoints = await endpointRepository.findByProjectId(projectId);
        // 4. Save to Cache ONLY if project is completed (expire in 1 hour)
        if (redisClient.isOpen && project.status === 'completed') {
            try {
                await redisClient.setEx(cacheKey, 3600, JSON.stringify(endpoints));
            }
            catch (err) {
                // Silent handling of cache write failures.
            }
        }
        return endpoints;
    }
}
