import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { getEndpointsByProject } from '../models/endpointModel.js';
import { getProjectById } from '../models/projectModel.js';
import redisClient from '../config/redis.js';

export const getProjectEndpoints = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId } = req.params;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    // 1. Validate user has access to project
    const project = await getProjectById(projectId as string, (req.user as any)._id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // 2. Check Redis Cache
    const cacheKey = `endpoints:${projectId}`;
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        // Return directly from cache, ensuring consistency
        const parsed = JSON.parse(cached);
        res.json(parsed);
        return;
      }
    }

    // 3. Get from DB
    const endpoints = await getEndpointsByProject(projectId as string);

    const endpointsWithId = endpoints.map(e => ({
      id: (e as any)._id,
      project_id: e.project_id,
      method: e.method,
      path: e.path,
      request_schema: e.request_schema,
      response_schema: e.response_schema
    }));

    // 4. Save to Cache ONLY if project is completed (expire in 1 hour)
    if (redisClient.isOpen && project.status === 'completed') {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(endpointsWithId));
    }

    res.json(endpointsWithId);
  } catch (error) {
    console.error('Error fetching endpoints:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
