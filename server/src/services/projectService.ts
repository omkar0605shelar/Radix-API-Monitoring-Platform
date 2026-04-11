import { ProjectRepository } from '../repositories/projectRepository.js';
// import { getChannel } from '../config/rabbitmq.js';
import { processScanJob } from '../workers/scannerWorker.js';

const projectRepository = new ProjectRepository();

export class ProjectService {
  async importRepository(userId: string, repositoryUrl: string) {
    // Extract repository name from URL (e.g., https://github.com/user/repo -> repo)
    const name = repositoryUrl.split('/').pop()?.replace('.git', '') || 'New Project';
    
    const project = await projectRepository.create(userId, repositoryUrl, name);
    
    // Trigger scan directly in the background
    processScanJob(project.id, repositoryUrl).catch(err => {
      console.error(`Background scan failed for project ${project.id}:`, err);
    });

    return project;
  }

  async getProjectsByUser(userId: string) {
    return projectRepository.findByUserId(userId);
  }

  async getProjectById(id: string, userId: string) {
    const project = await projectRepository.findById(id, userId);
    if (!project) {
       const error = new Error('Project not found');
       (error as any).statusCode = 404;
       throw error;
    }
    return project;
  }
}
