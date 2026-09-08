import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message || err);
  const status = err.statusCode || 500;
  
  if (req.headers.origin) {
    res.header('Access-Control-Allow-Origin', req.headers.origin as string);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
};
