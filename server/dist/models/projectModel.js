import { pool } from '../config/db.js';
export const createProject = async (userId, repositoryUrl) => {
    const result = await pool.query('INSERT INTO projects (user_id, repository_url, status) VALUES ($1, $2, $3) RETURNING *', [userId, repositoryUrl, 'pending']);
    return result.rows[0];
};
export const getProjectsByUser = async (userId) => {
    const result = await pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
};
export const getProjectById = async (id, userId) => {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [id, userId]);
    return result.rows[0] || null;
};
export const updateProjectStatus = async (id, status) => {
    await pool.query('UPDATE projects SET status = $1 WHERE id = $2', [status, id]);
};
