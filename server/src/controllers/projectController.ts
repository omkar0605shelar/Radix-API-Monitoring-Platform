import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { createProject, getProjectsByUser, getProjectById } from '../models/projectModel.js';
import { getChannel } from '../config/rabbitmq.js';

export const importRepository = async (req: AuthRequest, res: Response): Promise<void> => {
  const { repositoryUrl } = req.body;
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const project = await createProject((req.user as any)._id, repositoryUrl);
    
    // Send to RabbitMQ
    const channel = getChannel();
    if (channel) {
      channel.sendToQueue(
        'api_scan_jobs',
        Buffer.from(JSON.stringify({ projectId: (project as any)._id, repositoryUrl }))
      );
    } else {
      console.error('RabbitMQ channel not available');
    }

    res.status(201).json({
      id: (project as any)._id,
      repository_url: project.repository_url,
      status: project.status,
      created_at: project.created_at
    });
  } catch (error) {
    console.error('Error importing repository:', error);
    res.status(500).json({ message: 'Server error parsing repository' });
  }
};

export const getUserProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) return;
  try {
    const projects = await getProjectsByUser((req.user as any)._id);
    const projectsWithId = projects.map(p => ({
      id: (p as any)._id,
      repository_url: p.repository_url,
      status: p.status,
      created_at: p.created_at
    }));
    res.json(projectsWithId);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProjectDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) return;
  try {
    const project = await getProjectById(req.params.id as string, (req.user as any)._id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json({
      id: (project as any)._id,
      user_id: project.user_id,
      repository_url: project.repository_url,
      status: project.status,
      created_at: project.created_at
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
