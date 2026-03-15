const attendanceService = require('../services/attendanceService');

const ok = (res, code, data, msg = 'Success') =>
    res.status(code).json({ success: true, message: msg, data, error: null });
const err = (res, e) =>
    res.status(e.status || 500).json({ success: false, data: null, error: { code: e.code || 'SERVER_ERROR', message: e.message } });

// POST /api/v1/attendance/mark
const markAttendance = async (req, res) => {
    try {
        const { courseId, date, records } = req.body;
        if (!courseId || !date || !records || !Array.isArray(records)) {
            return res.status(400).json({
                success: false, data: null, error: { code: 'MISSING_FIELDS', message: 'courseId, date, and an array of records are required.' }
            });
        }
        const attendance = await attendanceService.markAttendance(req.user.id, courseId, date, records);
        return ok(res, 201, { attendance }, 'Attendance marked successfully.');
    } catch (e) {
        console.error(e);
        return err(res, e);
    }
};

// GET /api/v1/attendance/my-records (Student)
const getMyRecords = async (req, res) => {
    try {
        const data = await attendanceService.getStudentAttendance(req.user.id);
        return ok(res, 200, data, 'Student attendance fetched.');
    } catch (e) {
        console.error(e);
        return err(res, e);
    }
};

// GET /api/v1/attendance/course/:courseId (Faculty/Admin)
const getCourseAttendance = async (req, res) => {
    try {
        const data = await attendanceService.getCourseAttendance(req.params.courseId);
        return ok(res, 200, data, 'Course attendance fetched.');
    } catch (e) {
        console.error(e);
        return err(res, e);
    }
};

module.exports = {
    markAttendance,
    getMyRecords,
    getCourseAttendance,
};
