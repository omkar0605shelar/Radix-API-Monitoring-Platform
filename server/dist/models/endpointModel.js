import { pool } from '../config/db.js';
export const createEndpoint = async (projectId, method, path, requestSchema, responseSchema) => {
    const result = await pool.query('INSERT INTO endpoints (project_id, method, path, request_schema, response_schema) VALUES ($1, $2, $3, $4, $5) RETURNING *', [projectId, method, path, JSON.stringify(requestSchema), JSON.stringify(responseSchema)]);
    return result.rows[0];
};
export const getEndpointsByProject = async (projectId) => {
    const result = await pool.query('SELECT * FROM endpoints WHERE project_id = $1', [projectId]);
    return result.rows;
};
