const courseService = require('../services/courseService');
const Faculty = require('../models/Faculty');

const ok = (res, code, data, msg = 'Success', meta) =>
    res.status(code).json({ success: true, message: msg, data, meta, error: null });
const err = (res, e) =>
    res.status(e.status || 500).json({ success: false, data: null, error: { code: e.code || 'SERVER_ERROR', message: e.message } });

// GET /api/v1/courses
const getAllCourses = async (req, res) => {
    try {
        const { search, department, semester, isActive, page, limit } = req.query;
        const result = await courseService.getAllCourses({ search, department, semester, isActive, page, limit });
        return ok(res, 200, { courses: result.courses }, 'Courses fetched.', result.meta);
    } catch (e) { console.error(e); return err(res, e); }
};

// GET /api/v1/courses/my-courses (Faculty: courses they teach)
const getMyCourses = async (req, res) => {
    try {
        const courses = await courseService.getCoursesByFaculty(
            await Faculty.findOne({ user: req.user.id }).then(f => f?._id)
        );
        return ok(res, 200, { courses });
    } catch (e) { console.error(e); return err(res, e); }
};

// GET /api/v1/courses/:id
const getCourseById = async (req, res) => {
    try {
        const course = await courseService.getCourseById(req.params.id);
        return ok(res, 200, { course });
    } catch (e) { console.error(e); return err(res, e); }
};

// POST /api/v1/courses
const createCourse = async (req, res) => {
    try {
        const { code, title, description, credits, department, semester, primaryFaculty, maxEnrollment } = req.body;
        if (!code || !title || !department || !semester) {
            return res.status(400).json({ success: false, data: null, error: { code: 'MISSING_FIELDS', message: 'code, title, department, and semester are required.' } });
        }
        const course = await courseService.createCourse({ code, title, description, credits, department, semester, primaryFaculty, maxEnrollment });
        return ok(res, 201, { course }, 'Course created successfully.');
    } catch (e) { console.error(e); return err(res, e); }
};

// PUT /api/v1/courses/:id
const updateCourse = async (req, res) => {
    try {
        const course = await courseService.updateCourse(req.params.id, req.body);
        return ok(res, 200, { course }, 'Course updated.');
    } catch (e) { console.error(e); return err(res, e); }
};

// DELETE /api/v1/courses/:id
const deleteCourse = async (req, res) => {
    try {
        await courseService.deleteCourse(req.params.id);
        return ok(res, 200, null, 'Course deactivated.');
    } catch (e) { console.error(e); return err(res, e); }
};

// GET /api/v1/courses/:id/roster
const getCourseRoster = async (req, res) => {
    try {
        const roster = await courseService.getCourseRoster(req.params.id);
        return ok(res, 200, { roster, count: roster.length });
    } catch (e) { console.error(e); return err(res, e); }
};

module.exports = { getAllCourses, getMyCourses, getCourseById, createCourse, updateCourse, deleteCourse, getCourseRoster };
