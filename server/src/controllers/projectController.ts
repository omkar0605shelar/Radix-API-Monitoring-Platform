import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ProjectService } from '../services/projectService.js';

const projectService = new ProjectService();

export const importRepository = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { repositoryUrl } = req.body;
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const project = await projectService.importRepository((req.user as any).id, repositoryUrl);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const getUserProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) return;
  try {
    const projects = await projectService.getProjectsByUser((req.user as any).id);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) return;
  try {
    const project = await projectService.getProjectById(req.params.id as string, (req.user as any).id);
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const result = await projectService.deleteProject(req.params.id as string, (req.user as any).id);
    res.json({ message: 'Project deleted successfully', project: result });
  } catch (error) {
    next(error);
  }
};

