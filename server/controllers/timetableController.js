const Timetable = require('../models/Timetable');
const Course = require('../models/Course');

/**
 * Create timetable entry
 */
exports.createTimetable = async (req, res) => {
    try {
        const { course, faculty, dayOfWeek, startTime, endTime, classroom, semester, academicYear } = req.body;

        // Validate course exists
        const courseExists = await Course.findById(course);
        if (!courseExists) {
            return res.status(404).json({ error: { message: 'Course not found' } });
        }

        const timetable = new Timetable({
            course,
            faculty,
            dayOfWeek,
            startTime,
            endTime,
            classroom,
            semester,
            academicYear,
        });

        await timetable.save();
        res.status(201).json({ success: true, data: timetable });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

/**
 * Get timetable for a student (all enrolled courses)
 */
exports.getTimetableByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { academicYear } = req.query;

        // Find all courses the student is enrolled in
        const Enrollment = require('../models/Enrollment');
        const enrollments = await Enrollment.find({
            student: studentId,
            academicYear: academicYear || '2025-2026',
            status: { $in: ['enrolled', 'completed'] },
        }).select('course');

        const courseIds = enrollments.map(e => e.course);

        // Get timetable entries for those courses
        const timetable = await Timetable.find({
            course: { $in: courseIds },
            academicYear: academicYear || '2025-2026',
            isActive: true,
        }).populate('course', 'title code').populate('faculty', 'firstName lastName');

        res.json({ success: true, data: timetable });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

/**
 * Get timetable for a faculty member
 */
exports.getTimetableByFaculty = async (req, res) => {
    try {
        const { facultyId } = req.params;
        const { academicYear } = req.query;

        const timetable = await Timetable.find({
            faculty: facultyId,
            academicYear: academicYear || '2025-2026',
            isActive: true,
        })
            .populate('course', 'title code')
            .sort({ dayOfWeek: 1, startTime: 1 });

        res.json({ success: true, data: timetable });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

/**
 * Get all timetable entries
 */
exports.getAllTimetable = async (req, res) => {
    try {
        const { academicYear } = req.query;
        const timetable = await Timetable.find({
            academicYear: academicYear || '2025-2026',
        })
            .populate('course', 'title code')
            .populate('faculty', 'firstName lastName');

        res.json({ success: true, data: timetable });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

/**
 * Update timetable entry
 */
exports.updateTimetable = async (req, res) => {
    try {
        const { id } = req.params;
        const timetable = await Timetable.findByIdAndUpdate(id, req.body, { new: true });

        if (!timetable) {
            return res.status(404).json({ error: { message: 'Timetable not found' } });
        }

        res.json({ success: true, data: timetable });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

/**
 * Delete timetable entry
 */
exports.deleteTimetable = async (req, res) => {
    try {
        const { id } = req.params;
        await Timetable.findByIdAndDelete(id);
        res.json({ success: true, message: 'Timetable deleted' });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};
