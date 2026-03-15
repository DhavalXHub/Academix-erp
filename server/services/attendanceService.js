const AttendanceRecord = require('../models/AttendanceRecord');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

// ── Helpers ───────────────────────────────────────────────────────────────────
const _notFound = (msg) => Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });
const _conflict = (msg) => Object.assign(new Error(msg), { code: 'CONFLICT', status: 409 });
const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Mark attendance for a specific course and date.
 * Creates or updates the attendance record.
 */
const markAttendance = async (userId, courseId, dateParam, records) => {
    // 1. Validate faculty & course
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _bad('Only faculty members can mark attendance.');

    const course = await Course.findById(courseId);
    if (!course) throw _notFound('Course not found.');
    if (course.primaryFaculty.toString() !== faculty._id.toString()) {
        throw _bad('You are not authorized to mark attendance for this course.');
    }

    // 2. Parse date (strip time for accurate day-level indexing)
    const date = new Date(dateParam);
    date.setUTCHours(0, 0, 0, 0);

    // 3. Upsert record: if exists for course+date, update; otherwise create
    let doc = await AttendanceRecord.findOne({ course: courseId, date });
    
    if (doc) {
        // Update existing record
        // It's a full replacement of the array per the request
        doc.records = records;
        doc.faculty = faculty._id; // audit trail of last modifier
        await doc.save();
    } else {
        // Create new
        doc = await AttendanceRecord.create({
            course: courseId,
            faculty: faculty._id,
            date,
            records,
        });
    }

    return doc.populate([
        { path: 'course', select: 'code title' },
        { path: 'records.student', select: 'rollNumber user', populate: { path: 'user', select: 'name' } }
    ]);
};

/**
 * Get the logged-in student's full attendance history across all courses.
 * Calculates overall percentage per course.
 */
const getStudentAttendance = async (userId) => {
    const student = await Student.findOne({ user: userId });
    if (!student) throw _notFound('Student profile not found.');

    const records = await AttendanceRecord.find({ 'records.student': student._id })
        .populate('course', 'code title credits department')
        .sort({ date: -1 });

    // Format response and group by course
    const history = [];
    const courseStats = {};

    records.forEach(session => {
        const myRecord = session.records.find(r => r.student.toString() === student._id.toString());
        if (!myRecord) return; // Should never happen unless DB is corrupt

        const courseId = session.course._id.toString();
        if (!courseStats[courseId]) {
            courseStats[courseId] = {
                course: session.course,
                total: 0,
                present: 0,
                absent: 0,
                late: 0,
                excused: 0,
            };
        }

        courseStats[courseId].total += 1;
        courseStats[courseId][myRecord.status] += 1;

        history.push({
            date: session.date,
            course: session.course,
            status: myRecord.status,
            remarks: myRecord.remarks,
        });
    });

    const summary = Object.values(courseStats).map(stat => ({
        ...stat,
        percentage: stat.total > 0 ? Math.round(((stat.present + stat.late) / stat.total) * 100) : 0,
    }));

    return { summary, history };
};

/**
 * Get the full history for a specific course (Admin/Faculty).
 * Also aggregates attendance percentage per student for the entire course list.
 */
const getCourseAttendance = async (courseId) => {
    const records = await AttendanceRecord.find({ course: courseId })
        .populate('faculty', 'employeeId user')
        .populate({ path: 'faculty', populate: { path: 'user', select: 'name' } })
        .populate({
            path: 'records.student',
            select: 'rollNumber user',
            populate: { path: 'user', select: 'name email' }
        })
        .sort({ date: -1 });

    // Aggregate statistics per student
    const studentStats = {};
    let totalClasses = records.length;

    records.forEach(session => {
        session.records.forEach(r => {
            const sid = r.student._id.toString();
            if (!studentStats[sid]) {
                studentStats[sid] = {
                    student: r.student,
                    totalClasses: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                };
            }
            studentStats[sid].totalClasses += 1;
            studentStats[sid][r.status] += 1;
        });
    });

    const aggregateRoster = Object.values(studentStats).map(stat => ({
        ...stat,
        percentage: stat.totalClasses > 0 ? Math.round(((stat.present + stat.late) / stat.totalClasses) * 100) : 0,
    }));

    return { sessions: records, aggregateRoster, totalClasses };
};

module.exports = {
    markAttendance,
    getStudentAttendance,
    getCourseAttendance,
};
