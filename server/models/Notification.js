const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['assignment_created', 'quiz_created', 'announcement', 'general'],
        required: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    linkAction: {
        type: String,
        trim: true,
        default: '',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
