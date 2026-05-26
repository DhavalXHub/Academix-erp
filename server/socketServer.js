const { Server } = require('socket.io');
const { getAllowedOrigins } = require('./config/env');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Faculty = require('./models/Faculty');

let io;

const jwt = require('jsonwebtoken');

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: getAllowedOrigins(),
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }
        try {
            if (!process.env.JWT_SECRET) {
                return next(new Error('Authentication error: Server auth is not configured'));
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        if (process.env.NODE_ENV !== 'test') {
            console.log(`[Socket.IO] New client connected: ${socket.id}`);
        }

        socket.on('connectUser', () => {
            const userId = socket.user?.id;
            if (!userId) return;
            socket.join(`user_${userId}`);
        });

        socket.on('joinCourse', async (courseId) => {
            if (!courseId || !socket.user?.id) return;
            const isAllowed = await canJoinCourseRoom(socket.user, courseId);
            if (isAllowed) socket.join(`course_${courseId}`);
        });

        // Typing indicator for 1:1 chats
        socket.on('typing', ({ toUserId, fromUserId }) => {
            if (!toUserId || !fromUserId) return;
            io.to(`user_${toUserId}`).emit('typing', { fromUserId });
        });

        socket.on('stopTyping', ({ toUserId, fromUserId }) => {
            if (!toUserId || !fromUserId) return;
            io.to(`user_${toUserId}`).emit('stopTyping', { fromUserId });
        });

        socket.on('disconnect', () => {});
    });

    return io;
};

const canJoinCourseRoom = async (user, courseId) => {
    if (user.role === 'admin') return true;

    if (user.role === 'student') {
        return Boolean(await Enrollment.exists({ student: user.id, course: courseId, status: 'enrolled' }));
    }

    if (user.role === 'faculty') {
        const faculty = await Faculty.findOne({ user: user.id }).select('_id');
        if (!faculty) return false;
        return Boolean(await Course.exists({ _id: courseId, primaryFaculty: faculty._id, isActive: true }));
    }

    return false;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO is not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIO };
