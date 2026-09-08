import prisma from '../config/client.js';
/**
 * Middleware to track API usage and enforce tier-based limits.
 */
export const usageTrackingMiddleware = async (req, res, next) => {
    const projectId = req.headers['x-project-id'];
    if (!projectId) {
        return next();
    }
    try {
        // 1. Get project and user details to check limits
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                user: true
            }
        });
        if (!project)
            return next();
        // 2. Check current month's usage vs tier limits
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const usageCount = await prisma.usageRecord.count({
            where: {
                project_id: projectId,
                timestamp: { gte: startOfMonth },
                type: 'api_call'
            }
        });
        // Tier-based limits
        const limits = {
            'free': 1000,
            'pro': 50000,
            'enterprise': 1000000
        };
        const userTier = project.user.subscription_tier || 'free';
        const limit = limits[userTier] || 1000;
        if (usageCount >= limit) {
            return res.status(429).json({
                error: 'Usage limit exceeded',
                message: `You have reached the monthly limit for the ${userTier} tier (${limit} requests). Please upgrade to continue.`,
                upgrade_link: '/billing'
            });
        }
        // 3. Log the usage record (asynchronously)
        prisma.usageRecord.create({
            data: {
                project_id: projectId,
                type: 'api_call',
                count: 1
            }
        }).catch(err => console.error('Failed to log usage record:', err));
        next();
    }
    catch (error) {
        console.error('Usage Tracking Error:', error);
        next();
    }
};
