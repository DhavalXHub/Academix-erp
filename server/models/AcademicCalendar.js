const mongoose = require('mongoose');

const academicCalendarSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        academicYear: {
            type: String,
            required: true,
            trim: true
        },
        calendarType: {
            type: String,
            enum: ['academic', 'holiday', 'exam'],
            default: 'academic'
        },
        fileUrl: {
            type: String,
            required: true
        },
        fileName: {
            type: String,
            default: 'calendar.pdf'
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('AcademicCalendar', academicCalendarSchema);
