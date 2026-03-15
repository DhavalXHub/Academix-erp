const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const { getIO } = require('../socketServer');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });

const getNotifications = async (userId) => {
    return Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(50); // Keep it reasonable for real-time app
};

const markNotificationRead = async (userId, notificationId) => {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw _bad('Notification not found.');
    if (notification.recipient.toString() !== userId.toString()) throw _bad('Unauthorized.');

    notification.isRead = true;
    await notification.save();
    return notification;
};

// Internal utility to emit a notification
const emitNotification = (recipientId, notification) => {
    try {
        const io = getIO();
        io.to(`user_${recipientId}`).emit('newNotification', notification);
    } catch (err) {
        console.error('Socket.IO emit notification failed:', err.message);
    }
};

const createDirectNotification = async (recipientId, type, message, linkAction = '') => {
    const notification = await Notification.create({
        recipient: recipientId,
        type,
        message,
        linkAction,
    });
    
    emitNotification(recipientId, notification);
    return notification;
};

// Broadcasts an event to a course, creating mapped notification records for every student
const notifyCourseStudents = async (courseId, type, message, linkAction = '') => {
    const enrollments = await Enrollment.find({ course: courseId, status: 'enrolled' }).select('student');
    if (!enrollments.length) return;

    // We can use insertMany for performance
    const notifDocs = enrollments.map(e => ({
        recipient: e.student,
        type,
        message,
        linkAction,
    }));

    const inserted = await Notification.insertMany(notifDocs);

    try {
        const io = getIO();
        // Option 1: emit to the specific course room (clients must be told to handle this payload)
        // Option 2: iterate and emit to each student's personal channel. We will broadcast to course room for efficiency.
        // Wait, the client usually tracks notifications individually. Let's emit to the course room, but pass a generic event.
        // Actually, the prompt says "Each user should join a personal room.. Course announcements should broadcast to course_<courseId>... Implement events: newNotification". 
        // Emitting to course room is cleaner.
        io.to(`course_${courseId}`).emit('newNotification', { broadcast: true, type, message, linkAction });
    } catch (err) {
        console.error('Socket broadcast failed:', err.message);
    }

    return inserted;
};

module.exports = {
    getNotifications,
    markNotificationRead,
    createDirectNotification,
    notifyCourseStudents,
};
