const AcademicCalendar = require('../models/AcademicCalendar');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc    Get all academic calendars
// @route   GET /api/v1/academic-calendars
const getCalendars = asyncHandler(async (req, res) => {
    const { academicYear, calendarType } = req.query;
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (calendarType && calendarType !== 'all') filter.calendarType = calendarType;

    const calendars = await AcademicCalendar.find(filter)
        .populate('uploadedBy', 'name email role')
        .sort({ createdAt: -1 });

    return ApiResponse.success(res, 200, { calendars });
});

// @desc    Create/Upload academic calendar
// @route   POST /api/v1/academic-calendars
const uploadCalendar = asyncHandler(async (req, res) => {
    const { title, academicYear, calendarType } = req.body;
    if (!title || !academicYear || !calendarType) {
        throw ApiError.badRequest('title, academicYear, and calendarType are required.');
    }

    if (!req.file) {
        throw ApiError.badRequest('PDF or image file is required.');
    }

    const fileUrl = `/uploads/materials/${req.file.filename}`;
    const fileName = req.file.originalname;

    const calendar = await AcademicCalendar.create({
        title,
        academicYear,
        calendarType,
        fileUrl,
        fileName,
        uploadedBy: req.user.id,
    });

    // Broadcast notification to all students and faculty
    try {
        const notificationService = require('../services/notificationService');
        const typeLabel = calendarType === 'holiday' ? 'Holiday Schedule'
            : calendarType === 'exam' ? 'Exam Timetable'
            : 'Academic Calendar';
        await notificationService.broadcastAnnouncement(
            `📅 New ${typeLabel} Uploaded`,
            `"${title}" for ${academicYear} is now available in the Academic Calendar section.`,
            'all',
            'Admin'
        );
    } catch (notifErr) {
        console.error('[Calendar Notification] Failed:', notifErr.message);
    }

    return ApiResponse.success(res, 201, { calendar }, 'Calendar uploaded successfully.');
});

// @desc    Delete academic calendar
// @route   DELETE /api/v1/academic-calendars/:id
const deleteCalendar = asyncHandler(async (req, res) => {
    const calendar = await AcademicCalendar.findById(req.params.id);
    if (!calendar) throw ApiError.notFound('Calendar not found.');

    await calendar.deleteOne();
    return ApiResponse.success(res, 200, null, 'Calendar deleted successfully.');
});

module.exports = {
    getCalendars,
    uploadCalendar,
    deleteCalendar,
};
