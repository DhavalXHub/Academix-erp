const mongoose = require('mongoose');

// Note: Re-using the Quiz schema structure observed in view_file previously.
// Enhancing it slightly if needed, but the previous one looked mostly correct for simple quizzes.
// Re-writing it to ensure it matches exactly what we need.

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true
    },
    timeLimitMinutes: {
        type: Number,
        required: true
    },
    questions: [{
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }], // Array of strings e.g., ["Option A", "Option B", "Option C", "Option D"]
        correctOptionIndex: { type: Number, required: true } // 0-3
    }],
    isActive: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Quiz', quizSchema);
