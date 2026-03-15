const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`[Socket.IO] New client connected: ${socket.id}`);

        socket.on('connectUser', (userId) => {
            if (!userId) return;
            // User joins their personal room for direct messages and notifications
            socket.join(`user_${userId}`);
            console.log(`[Socket.IO] User ${userId} joined room user_${userId}`);
        });

        socket.on('joinCourse', (courseId) => {
            if (!courseId) return;
            // Users join course rooms to receive announcements
            socket.join(`course_${courseId}`);
            console.log(`[Socket.IO] Client joined room course_${courseId}`);
        });

        socket.on('disconnect', () => {
             console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO is not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIO };
