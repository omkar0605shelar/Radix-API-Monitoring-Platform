import { getEndpointsByProject } from '../models/endpointModel.js';
import { getProjectById } from '../models/projectModel.js';
import redisClient from '../config/redis.js';
export const getProjectEndpoints = async (req, res) => {
    const { projectId } = req.params;
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        // 1. Validate user has access to project
        const project = await getProjectById(projectId, req.user.id);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        // 2. Check Redis Cache
        const cacheKey = `endpoints:${projectId}`;
        if (redisClient.isOpen) {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                res.json(JSON.parse(cached));
                return;
            }
        }
        // 3. Get from DB
        const endpoints = await getEndpointsByProject(projectId);
        // 4. Save to Cache (expire in 1 hour)
        if (redisClient.isOpen) {
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(endpoints));
        }
        res.json(endpoints);
    }
    catch (error) {
        console.error('Error fetching endpoints:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
