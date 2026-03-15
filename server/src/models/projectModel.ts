import { pool } from '../config/db.js';

export interface Project {
  id: string;
  user_id: string;
  repository_url: string;
  status: string;
  created_at: Date;
}

export const createProject = async (userId: string, repositoryUrl: string): Promise<Project> => {
  const result = await pool.query(
    'INSERT INTO projects (user_id, repository_url, status) VALUES ($1, $2, $3) RETURNING *',
    [userId, repositoryUrl, 'pending']
  );
  return result.rows[0];
};

export const getProjectsByUser = async (userId: string): Promise<Project[]> => {
  const result = await pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows;
};

export const getProjectById = async (id: string, userId: string): Promise<Project | null> => {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [id, userId]);
  return result.rows[0] || null;
};

export const updateProjectStatus = async (id: string, status: string): Promise<void> => {
  await pool.query('UPDATE projects SET status = $1 WHERE id = $2', [status, id]);
};
