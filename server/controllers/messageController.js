const messageService = require('../services/messageService');

const ok = (res, code, data, msg = 'Success') => res.status(code).json({ success: true, message: msg, data, error: null });
const err = (res, e) => res.status(e.status || 500).json({ success: false, data: null, error: { code: e.code || 'SERVER_ERROR', message: e.message } });

const sendMessage = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        if (!recipientId || !content) {
            return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'recipientId and content are required.' } });
        }
        const message = await messageService.sendMessage(req.user.id, recipientId, content);
        return ok(res, 201, { message }, 'Message sent.');
    } catch (e) { return err(res, e); }
};

const getConversation = async (req, res) => {
    try {
        const messages = await messageService.getConversation(req.user.id, req.params.userId);
        return ok(res, 200, { messages });
    } catch (e) { return err(res, e); }
};

const markMessageRead = async (req, res) => {
    try {
        const message = await messageService.markAsRead(req.user.id, req.params.id);
        return ok(res, 200, { message }, 'Message marked as read.');
    } catch (e) { return err(res, e); }
};

const markConversationRead = async (req, res) => {
    try {
        const result = await messageService.markConversationRead(req.user.id, req.params.userId);
        return ok(res, 200, { updated: result.modifiedCount ?? result.nModified ?? 0 }, 'Conversation marked as read.');
    } catch (e) { return err(res, e); }
};

const getUnreadCounts = async (req, res) => {
    try {
        const counts = await messageService.getUnreadCounts(req.user.id);
        return ok(res, 200, { counts });
    } catch (e) { return err(res, e); }
};

module.exports = { sendMessage, getConversation, markMessageRead, markConversationRead, getUnreadCounts };
