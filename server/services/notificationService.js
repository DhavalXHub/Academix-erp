const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { getIO } = require('../socketServer');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });

/** Fetch latest 60 notifications for a user */
const getNotifications = async (userId) => {
    return Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(60);
};

/** Mark a single notification as read */
const markNotificationRead = async (userId, notificationId) => {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw _bad('Notification not found.');
    if (notification.recipient.toString() !== userId.toString()) throw _bad('Unauthorized.');
    notification.isRead = true;
    await notification.save();
    return notification;
};

/** Mark ALL notifications as read for a user */
const markAllRead = async (userId) => {
    await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });
};

/** Emit a notification to a user's personal socket room */
const emitToUser = (recipientId, notification) => {
    try {
        const io = getIO();
        io.to(`user_${recipientId}`).emit('newNotification', notification);
    } catch (err) {
        console.error('[Notification] Socket emit failed:', err.message);
    }
};

/**
 * Create + emit a notification to a single user.
 * Used for: messages, graded submissions, direct admin actions.
 */
const createDirectNotification = async (recipientId, type, message, linkAction = '') => {
    const notification = await Notification.create({
        recipient: recipientId,
        type,
        message,
        linkAction,
    });
    emitToUser(recipientId, notification);
    return notification;
};

/**
 * Broadcast an announcement notification to ALL users matching target.
 * target: 'all' | 'student' | 'faculty'
 */
const broadcastAnnouncement = async (title, content, targetAudience = 'all', postedByName = 'Admin') => {
    let userQuery = {};
    if (targetAudience === 'student') userQuery.role = 'student';
    else if (targetAudience === 'faculty') userQuery.role = 'faculty';
    else userQuery.role = { $in: ['student', 'faculty'] }; // 'all' — exclude admins from announcement spam

    const users = await User.find({ ...userQuery, isActive: true }).select('_id').lean();
    if (!users.length) return;

    const message = `📢 ${postedByName}: "${title}" — ${content.substring(0, 80)}${content.length > 80 ? '...' : ''}`;
    const notifDocs = users.map(u => ({
        recipient: u._id,
        type: 'announcement',
        message,
        linkAction: '/announcements',
    }));

    const inserted = await Notification.insertMany(notifDocs);

    // Emit to every user's personal room (guaranteed delivery regardless of course rooms)
    try {
        const io = getIO();
        users.forEach(u => {
            const notif = inserted.find(n => n.recipient.toString() === u._id.toString());
            if (notif) io.to(`user_${u._id}`).emit('newNotification', notif);
        });
    } catch (err) {
        console.error('[Notification] Socket broadcast failed:', err.message);
    }

    return inserted;
};

/**
 * Notify all students enrolled in a course.
 * Emits to personal user rooms (reliable — doesn't require course room membership).
 */
const notifyCourseStudents = async (courseId, type, message, linkAction = '') => {
    const enrollments = await Enrollment.find({ course: courseId, status: 'enrolled' })
        .populate({ path: 'student', select: 'user' });

    if (!enrollments.length) return;

    const notifDocs = enrollments.map(e => ({
        recipient: e.student.user,
        type,
        message,
        linkAction,
    }));

    const inserted = await Notification.insertMany(notifDocs);

    try {
        const io = getIO();
        enrollments.forEach(e => {
            const userId = e.student.user.toString();
            const notif = inserted.find(n => n.recipient.toString() === userId);
            if (notif) io.to(`user_${userId}`).emit('newNotification', notif);
        });
    } catch (err) {
        console.error('[Notification] Socket course notify failed:', err.message);
    }

    return inserted;
};

/**
 * Send deadline reminder notifications for assignments due in `hoursAhead` hours.
 * Called by the cron scheduler.
 */
const sendDeadlineReminders = async (hoursAhead) => {
    const Assignment = require('../models/Assignment');
    const Student = require('../models/Student');

    const now = new Date();
    // Query assignments due in the future (within the window) that haven't been notified yet
    const windowStart = now; // Only look forward from now
    const windowEnd = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const is1Day = hoursAhead === 24;
    const query = {
        dueDate: { $gte: windowStart, $lte: windowEnd }
    };
    
    if (is1Day) {
        query.notified1Day = false;
    } else {
        query.notified1Hour = false;
    }

    const assignments = await Assignment.find(query).populate('course', 'name');

    if (!assignments.length) return;

    const type = is1Day ? 'assignment_deadline_1day' : 'assignment_deadline_1hour';
    const timeLabel = is1Day ? '1 day' : '1 hour';

    let notifiedCount = 0;

    for (const assignment of assignments) {
        const courseId = assignment.course._id || assignment.course;
        const enrollments = await Enrollment.find({ course: courseId, status: 'enrolled' })
            .populate({ path: 'student', select: 'user' });

        if (!enrollments.length) continue;

        const courseName = assignment.course?.name || 'your course';
        const message = `⏰ Deadline Alert: "${assignment.title}" in ${courseName} is due in ${timeLabel}!`;

        const notifDocs = enrollments.map(e => ({
            recipient: e.student.user,
            type,
            message,
            linkAction: '/student/assignments',
        }));

        const inserted = await Notification.insertMany(notifDocs);

        try {
            const io = getIO();
            enrollments.forEach(e => {
                const userId = e.student.user.toString();
                const notif = inserted.find(n => n.recipient.toString() === userId);
                if (notif) io.to(`user_${userId}`).emit('newNotification', notif);
            });
        } catch (err) {
            console.error('[Notification] Deadline reminder emit failed:', err.message);
        }

        // Set the flag to true and save the assignment to prevent duplicate reminders
        if (is1Day) {
            assignment.notified1Day = true;
        } else {
            assignment.notified1Hour = true;
        }
        await assignment.save();
        notifiedCount++;
    }

    if (notifiedCount > 0) {
        console.log(`[DeadlineReminder] Sent ${type} reminders for ${notifiedCount} assignments.`);
    }
};

module.exports = {
    getNotifications,
    markNotificationRead,
    markAllRead,
    createDirectNotification,
    broadcastAnnouncement,
    notifyCourseStudents,
    sendDeadlineReminders,
};
