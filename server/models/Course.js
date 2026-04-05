const mongoose = require('mongoose');

/**
 * Course (upgraded Subject) model.
 * Replaces the thin Subject schema with proper references and validation.
 * NOTE: The legacy Subject model is kept for backward compatibility with AttendanceRoutes.
 */
const courseSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Course code is required'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        credits: {
            type: Number,
            required: true,
            min: [1, 'Credits must be at least 1'],
            max: [6, 'Credits cannot exceed 6'],
            default: 4,
        },
        department: {
            type: String,
            required: [true, 'Department is required'],
            trim: true,
        },
        semester: {
            type: Number,
            required: true,
            min: 1,
            max: 8,
        },
        primaryFaculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        maxEnrollment: {
            type: Number,
            default: 60,
        },
    },
    { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
courseSchema.index({ code: 1 });
courseSchema.index({ department: 1, semester: 1 });
courseSchema.index({ primaryFaculty: 1 });
courseSchema.index({ isActive: 1 });

module.exports = mongoose.model('Course', courseSchema);
