const courseService = require('../services/courseService');
const Faculty = require('../models/Faculty');
const { getIO } = require('../socketServer');

const ok = (res, code, data, msg = 'Success', meta) =>
    res.status(code).json({ success: true, message: msg, data, meta, error: null });
const err = (res, e) =>
    res.status(e.status || 500).json({ success: false, data: null, error: { code: e.code || 'SERVER_ERROR', message: e.message } });

// Broadcast a course_updated event so all connected clients (students/faculty) can re-fetch
const broadcastCourseUpdate = (courseId, payload) => {
    try {
        const io = getIO();
        io.to(`course_${courseId}`).emit('course_updated', payload);
        // Also broadcast globally so admin/others not in course room get it
        io.emit('courses_changed', { courseId, ...payload });
    } catch (e) {
        console.warn('[Socket] broadcastCourseUpdate failed:', e.message);
    }
};

// GET /api/v1/courses
const getAllCourses = async (req, res) => {
    try {
        const { search, department, semester, isActive, page, limit } = req.query;
        const result = await courseService.getAllCourses({ search, department, semester, isActive, page, limit });
        return ok(res, 200, { courses: result.courses }, 'Courses fetched.', result.meta);
    } catch (e) { console.error(e); return err(res, e); }
};

// GET /api/v1/courses/my-courses (Faculty: courses they teach)
// primaryFaculty on Course stores Faculty._id — look it up from User._id
const getMyCourses = async (req, res) => {
    try {
        const faculty = await Faculty.findOne({ user: req.user.id });
        if (!faculty) return ok(res, 200, { courses: [] });
        const courses = await courseService.getCoursesByFaculty(faculty._id);
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
        // Notify everyone that the course catalog changed
        try { getIO().emit('courses_changed', { action: 'created', courseId: course._id }); } catch (_) {}
        return ok(res, 201, { course }, 'Course created successfully.');
    } catch (e) { console.error(e); return err(res, e); }
};

// PUT /api/v1/courses/:id
const updateCourse = async (req, res) => {
    try {
        const course = await courseService.updateCourse(req.params.id, req.body);
        // Broadcast so students/faculty panels update immediately
        broadcastCourseUpdate(course._id.toString(), { action: 'updated', course: { _id: course._id, title: course.title, isActive: course.isActive, primaryFaculty: course.primaryFaculty } });
        return ok(res, 200, { course }, 'Course updated.');
    } catch (e) { console.error(e); return err(res, e); }
};

// DELETE /api/v1/courses/:id  (soft-delete = deactivate)
const deleteCourse = async (req, res) => {
    try {
        const course = await courseService.deleteCourse(req.params.id);
        broadcastCourseUpdate(course._id.toString(), { action: 'deactivated', courseId: course._id });
        return ok(res, 200, { course }, 'Course deactivated.');
    } catch (e) { console.error(e); return err(res, e); }
};

// GET /api/v1/courses/:id/roster
const getCourseRoster = async (req, res) => {
    try {
        const roster = await courseService.getCourseRoster(req.params.id);
        return ok(res, 200, { roster, count: roster.length });
    } catch (e) { console.error(e); return err(res, e); }
};

// PATCH /api/v1/courses/:id/reactivate — Admin can re-activate a deactivated course
const reactivateCourse = async (req, res) => {
    try {
        const course = await courseService.updateCourse(req.params.id, { isActive: true });
        broadcastCourseUpdate(course._id.toString(), { action: 'reactivated', courseId: course._id });
        return ok(res, 200, { course }, 'Course reactivated.');
    } catch (e) { console.error(e); return err(res, e); }
};

module.exports = { getAllCourses, getMyCourses, getCourseById, createCourse, updateCourse, deleteCourse, getCourseRoster, reactivateCourse };
