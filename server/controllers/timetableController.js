const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const ok = (res, status, data, message = 'Success') => {
    res.status(status).json({ success: true, message, data, error: null, requestId: res.getHeader('X-Request-Id') });
};

const fail = (res, status, code, message, data = null) => {
    res.status(status).json({ success: false, data, error: { code, message }, requestId: res.getHeader('X-Request-Id') });
};

const toMinutes = (time) => {
    const [hours, minutes] = String(time || '').split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
    return hours * 60 + minutes;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => {
    const startA = toMinutes(aStart);
    const endA = toMinutes(aEnd);
    const startB = toMinutes(bStart);
    const endB = toMinutes(bEnd);
    return startA < endB && startB < endA;
};

const validateTimes = (startTime, endTime) => {
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    return !Number.isNaN(start) && !Number.isNaN(end) && end > start;
};

const findConflicts = async ({ faculty, dayOfWeek, startTime, endTime, classroom, semester, academicYear, excludeId }) => {
    const query = {
        dayOfWeek,
        academicYear,
        isActive: true,
    };

    if (excludeId) query._id = { $ne: excludeId };

    const possible = await Timetable.find({
        ...query,
        $or: [
            { faculty },
            { classroom },
            { semester },
        ],
    }).populate('course', 'code title');

    return possible.filter((item) => overlaps(startTime, endTime, item.startTime, item.endTime)).map((item) => {
        let type = 'semester';
        if (String(item.faculty) === String(faculty)) type = 'faculty';
        if (item.classroom === classroom) type = 'classroom';
        return {
            type,
            timetableId: item._id,
            course: item.course,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            classroom: item.classroom,
        };
    });
};

exports.createTimetable = async (req, res, next) => {
    try {
        const { course, faculty, dayOfWeek, startTime, endTime, classroom, semester, academicYear } = req.body;

        if (!course || !faculty || !dayOfWeek || !startTime || !endTime || !classroom || !semester || !academicYear) {
            return fail(res, 400, 'MISSING_FIELDS', 'course, faculty, dayOfWeek, startTime, endTime, classroom, semester, and academicYear are required.');
        }

        if (!validateTimes(startTime, endTime)) {
            return fail(res, 400, 'INVALID_TIME_RANGE', 'endTime must be after startTime.');
        }

        const courseExists = await Course.findById(course);
        if (!courseExists) return fail(res, 404, 'COURSE_NOT_FOUND', 'Course not found.');

        const conflicts = await findConflicts({ faculty, dayOfWeek, startTime, endTime, classroom, semester, academicYear });
        if (conflicts.length > 0) {
            return fail(res, 409, 'TIMETABLE_CONFLICT', 'Timetable entry conflicts with an existing class.', { conflicts });
        }

        const timetable = await Timetable.create({ course, faculty, dayOfWeek, startTime, endTime, classroom, semester, academicYear });
        const populated = await timetable.populate([
            { path: 'course', select: 'title code department semester' },
            { path: 'faculty', select: 'employeeId designation department', populate: { path: 'user', select: 'name email' } },
        ]);

        ok(res, 201, { timetable: populated }, 'Timetable entry created.');
    } catch (error) {
        next(error);
    }
};

exports.getTimetableByStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { academicYear = '2025-2026' } = req.query;

        const enrollments = await Enrollment.find({
            student: studentId,
            academicYear,
            status: { $in: ['enrolled', 'completed'] },
        }).select('course');

        const courseIds = enrollments.map(e => e.course);
        const timetable = await Timetable.find({ course: { $in: courseIds }, academicYear, isActive: true })
            .populate('course', 'title code department semester')
            .populate({ path: 'faculty', select: 'employeeId designation department', populate: { path: 'user', select: 'name email' } })
            .sort({ dayOfWeek: 1, startTime: 1 });

        ok(res, 200, { timetable });
    } catch (error) {
        next(error);
    }
};

exports.getTimetableByFaculty = async (req, res, next) => {
    try {
        const { facultyId } = req.params;
        const { academicYear = '2025-2026' } = req.query;

        const timetable = await Timetable.find({ faculty: facultyId, academicYear, isActive: true })
            .populate('course', 'title code department semester')
            .sort({ dayOfWeek: 1, startTime: 1 });

        ok(res, 200, { timetable });
    } catch (error) {
        next(error);
    }
};

exports.getAllTimetable = async (req, res, next) => {
    try {
        const { academicYear = '2025-2026', semester, faculty } = req.query;
        const query = { academicYear, isActive: true };
        if (semester) query.semester = Number(semester);
        if (faculty) query.faculty = faculty;

        const timetable = await Timetable.find(query)
            .populate('course', 'title code department semester')
            .populate({ path: 'faculty', select: 'employeeId designation department', populate: { path: 'user', select: 'name email' } })
            .sort({ dayOfWeek: 1, startTime: 1 });

        ok(res, 200, { timetable });
    } catch (error) {
        next(error);
    }
};

exports.updateTimetable = async (req, res, next) => {
    try {
        const existing = await Timetable.findById(req.params.id);
        if (!existing) return fail(res, 404, 'NOT_FOUND', 'Timetable not found.');

        const payload = { ...existing.toObject(), ...req.body };
        if (!validateTimes(payload.startTime, payload.endTime)) {
            return fail(res, 400, 'INVALID_TIME_RANGE', 'endTime must be after startTime.');
        }

        const conflicts = await findConflicts({ ...payload, excludeId: req.params.id });
        if (conflicts.length > 0) {
            return fail(res, 409, 'TIMETABLE_CONFLICT', 'Timetable update conflicts with an existing class.', { conflicts });
        }

        const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('course', 'title code department semester')
            .populate({ path: 'faculty', select: 'employeeId designation department', populate: { path: 'user', select: 'name email' } });

        ok(res, 200, { timetable }, 'Timetable entry updated.');
    } catch (error) {
        next(error);
    }
};

exports.deleteTimetable = async (req, res, next) => {
    try {
        const timetable = await Timetable.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!timetable) return fail(res, 404, 'NOT_FOUND', 'Timetable not found.');
        ok(res, 200, { id: req.params.id }, 'Timetable entry deactivated.');
    } catch (error) {
        next(error);
    }
};
