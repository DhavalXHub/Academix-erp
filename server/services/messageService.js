const Message = require('../models/Message');
const User = require('../models/User');
const { getIO } = require('../socketServer');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });

const getConversation = async (userId, otherUserId) => {
    // Get chat history between two users
    return Message.find({
        $or: [
            { sender: userId, recipient: otherUserId },
            { sender: otherUserId, recipient: userId },
        ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name email role')
    .populate('recipient', 'name email role');
};

const sendMessage = async (senderId, recipientId, content) => {
    if (!content || !content.trim()) throw _bad('Message content cannot be empty.');
    
    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) throw _bad('Recipient not found.');

    const message = await Message.create({
        sender: senderId,
        recipient: recipientId,
        content: content.trim(),
    });

    await message.populate('sender', 'name email role');
    await message.populate('recipient', 'name email role');

    // Emit real-time message via Socket.IO
    try {
        const io = getIO();
        io.to(`user_${recipientId}`).emit('receiveMessage', message);
    } catch (err) {
        console.error('Socket.IO emit failed:', err.message);
    }

    return message;
};

const markAsRead = async (userId, messageId) => {
    const message = await Message.findById(messageId);
    if (!message) return null;
    if (message.recipient.toString() !== userId.toString()) return null;

    message.readAt = Date.now();
    await message.save();
    return message;
};

const markConversationRead = async (userId, otherUserId) => {
    return Message.updateMany(
        { sender: otherUserId, recipient: userId, readAt: null },
        { $set: { readAt: new Date() } }
    );
};

const getUnreadCounts = async (userId) => {
    const rows = await Message.aggregate([
        { $match: { recipient: require('mongoose').Types.ObjectId(userId), readAt: null } },
        { $group: { _id: '$sender', count: { $sum: 1 } } },
    ]);
    const map = {};
    rows.forEach(r => { map[String(r._id)] = r.count; });
    return map;
};

module.exports = {
    getConversation,
    sendMessage,
    markAsRead,
    markConversationRead,
    getUnreadCounts,
};
