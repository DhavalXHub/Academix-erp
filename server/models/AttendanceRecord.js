const mongoose = require('mongoose');

/**
 * AttendanceRecord — Represents a single session's attendance for a specific course.
 * Contains an array of records for all enrolled students.
 * Prevents multiple attendance sessions for the same course on the same day.
 */
const attendanceRecordSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Faculty',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        records: [
            {
                student: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Student',
                    required: true,
                },
                status: {
                    type: String,
                    enum: ['present', 'absent', 'late', 'excused'],
                    required: true,
                },
                remarks: {
                    type: String,
                    default: '',
                },
            },
        ],
    },
    { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Ensure only one attendance record per course per day to prevent duplicate entries
attendanceRecordSchema.index({ course: 1, date: 1 }, { unique: true });
// Optimize faculty searching for their past attendance sessions
attendanceRecordSchema.index({ faculty: 1, date: -1 });
// The 'records.student' needs indexing so students can efficiently query their attendance history
attendanceRecordSchema.index({ 'records.student': 1, date: -1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
