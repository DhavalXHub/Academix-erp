const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    // Map questionId -> selectedOptionIndex
    answers: {
        type: Map,
        of: Number,
        default: {}
    },
    score: {
        type: Number,
        default: 0
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Ensure one attempt per student per quiz (if we want to restrict to 1 attempt)
// The prompt says "prevent multiple attempts if restricted" but doesn't explicitly mention a setting. Let's make it unique.
quizAttemptSchema.index({ quiz: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
