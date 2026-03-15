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
    const project = await createProject(req.user.id, repositoryUrl);
    
    // Send to RabbitMQ
    const channel = getChannel();
    if (channel) {
      channel.sendToQueue(
        'api_scan_jobs',
        Buffer.from(JSON.stringify({ projectId: project.id, repositoryUrl }))
      );
    } else {
      console.error('RabbitMQ channel not available');
    }

    res.status(201).json(project);
  } catch (error) {
    console.error('Error importing repository:', error);
    res.status(500).json({ message: 'Server error parsing repository' });
  }
};

export const getUserProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) return;
  try {
    const projects = await getProjectsByUser(req.user.id);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProjectDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) return;
  try {
    const project = await getProjectById(req.params.id as string, req.user.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
