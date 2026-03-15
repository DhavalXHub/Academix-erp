const notificationService = require('../services/notificationService');

const ok = (res, code, data, msg = 'Success') => res.status(code).json({ success: true, message: msg, data, error: null });
const err = (res, e) => res.status(e.status || 500).json({ success: false, data: null, error: { code: e.code || 'SERVER_ERROR', message: e.message } });

const getNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getNotifications(req.user.id);
        return ok(res, 200, { notifications });
    } catch (e) { return err(res, e); }
};

const markNotificationRead = async (req, res) => {
    try {
        const notification = await notificationService.markNotificationRead(req.user.id, req.params.id);
        return ok(res, 200, { notification }, 'Notification marked as read.');
    } catch (e) { return err(res, e); }
};

module.exports = { getNotifications, markNotificationRead };
