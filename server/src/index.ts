import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { initSocket } from './config/socket.js';
import { initDb } from './config/db.js';
import { connectRedis } from './config/redis.js';
// import { connectRabbitMQ } from './config/rabbitmq.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import endpointRoutes from './routes/endpointRoutes.js';
import testingRoutes from './routes/testingRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import mockRoutes from './routes/mockRoutes.js';
import githubRoutes from './routes/githubRoutes.js';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { startWorker } from './workers/scannerWorker.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = initSocket(httpServer);

// Security & Performance Middleware
app.use(helmet({
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100, // 100 requests per 15 minutes
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api/', limiter);

// App-wide Socket instance
app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/endpoints', endpointRoutes);
app.use('/api/testing', testingRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/mock', mockRoutes);
app.use('/api/github', githubRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'RADIX Server running' });
});

// Global Error Handler
app.use(errorHandler);

// Start function
const start = async () => {
  try {
    // Initialize Core Services
    await initDb();
    
    // Start background services in parallel
    connectRedis().then(() => {
      startWorker();
    }).catch(err => {
      console.error('⚠️  Background services failed to initialize fully:', err.message);
    });
    
    // Start HTTP Server
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 RADIX Backend Operational on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    });

    httpServer.on('error', (error: any) => {
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
