import { pool } from '../config/db.js';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  google_id?: string;
  created_at: Date;
}

export const createUser = async (name: string, email: string, password?: string, google_id?: string): Promise<User> => {
  const result = await pool.query(
    'INSERT INTO users (name, email, password, google_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, password, google_id]
  );
  return result.rows[0];
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};
