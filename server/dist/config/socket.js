import { Server } from 'socket.io';
let io;
export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['polling', 'websocket'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
    });
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        socket.on('join_project', (projectId) => {
            socket.join(projectId);
            console.log(`Socket ${socket.id} joined project ${projectId}`);
        });
        socket.on('disconnect', () => console.log('Client disconnected'));
    });
    return io;
};
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
