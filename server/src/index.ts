import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import endpointRoutes from './routes/endpointRoutes.js';
import { startWorker } from './workers/scannerWorker.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/endpoints', endpointRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API Insight Server running' });
});

// Start function
const start = async () => {
  try {
    await initDb();
    await connectRedis();
    await connectRabbitMQ();
    
    // Start RabbitMQ background worker
    startWorker();
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Error: Port ${PORT} is already in use. Please stop the process using it.`);
      } else {
        console.error('Server failed to start:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Backend initialization failed:', error);
    process.exit(1);
  }
};

start();
