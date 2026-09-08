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
import incidentRoutes from './routes/incidentRoutes.js';
import remediationRoutes from './routes/remediationRoutes.js';
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
app.use(cors({
    origin: ['http://localhost:5173', `${process.env.FRONTEND_URL}`, `${process.env.AWS_EC2_IP}`],
    credentials: true
}));
app.use(express.json());
// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === 'production' ? 100 : 10000, // 10k limit for local development
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use('/api/', limiter);
// App-wide Socket instance
app.set('io', io);
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/projects', '/projects'], projectRoutes);
app.use(['/api/endpoints', '/endpoints'], endpointRoutes);
app.use(['/api/testing', '/testing'], testingRoutes);
app.use(['/api/teams', '/teams'], teamRoutes);
app.use(['/api/mock', '/mock'], mockRoutes);
app.use(['/api/github', '/github'], githubRoutes);
app.use(['/api/incidents', '/incidents'], incidentRoutes);
app.use(['/api/remediations', '/remediations'], remediationRoutes);
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
            console.log(`🔗 API Base: http://13.206.50.255:${PORT}/api`);
        });
        httpServer.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Error: Port ${PORT} is already in use. Please stop the process using it.`);
            }
            else {
                console.error('Server failed to start:', error);
            }
            process.exit(1);
        });
    }
    catch (error) {
        console.error('Backend initialization failed:', error);
        process.exit(1);
    }
};
start();
