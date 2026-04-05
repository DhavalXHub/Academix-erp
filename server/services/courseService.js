const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');

// ── Helpers ───────────────────────────────────────────────────────────────────

const _notFound = (msg = 'Course not found.') =>
    Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });

const _conflict = (msg) =>
    Object.assign(new Error(msg), { code: 'CONFLICT', status: 409 });

// ── Course CRUD ───────────────────────────────────────────────────────────────

/**
 * Paginated list of courses with optional search, department and semester filters.
 */
const getAllCourses = async ({ search, department, semester, isActive, page = 1, limit = 20 }) => {
    const query = {};
    if (department) query.department = { $regex: department, $options: 'i' };
    if (semester) query.semester = Number(semester);
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
        query.$or = [
            { code: { $regex: search, $options: 'i' } },
            { title: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
        Course.find(query)
            .populate('primaryFaculty', 'name email')
            .sort({ department: 1, semester: 1, code: 1 })
            .skip(skip)
            .limit(Number(limit)),
        Course.countDocuments(query),
    ]);

    return {
        courses,
        meta: { page: Number(page), limit: Number(limit), totalRecords: total, totalPages: Math.ceil(total / limit) },
    };
};

/**
 * Get a single course by ID with populated faculty info.
 */
const getCourseById = async (id) => {
    const course = await Course.findById(id)
        .populate('primaryFaculty', 'name email');
    if (!course) throw _notFound();
    return course;
};

/**
 * Get all courses taught by a specific faculty member.
 */
const getCoursesByFaculty = async (facultyId) => {
    return Course.find({ primaryFaculty: facultyId, isActive: true })
        .populate('primaryFaculty', 'name email')
        .sort({ semester: 1, code: 1 });
};

/**
 * Create a new course. Code must be globally unique.
 */
const createCourse = async (data) => {
    const existing = await Course.findOne({ code: data.code.toUpperCase() });
    if (existing) throw _conflict(`A course with code '${data.code.toUpperCase()}' already exists.`);
    return Course.create(data);
};

/**
 * Update course fields. Admin only.
 */
const updateCourse = async (id, updates) => {
    const course = await Course.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        .populate('primaryFaculty', 'name email');
    if (!course) throw _notFound();
    return course;
};

/**
 * Soft-delete a course (set isActive: false).
 * Cannot delete a course that has active enrollments.
 */
const deleteCourse = async (id) => {
    const activeEnrollments = await Enrollment.countDocuments({ course: id, status: 'enrolled' });
    if (activeEnrollments > 0) {
        throw Object.assign(
            new Error(`Cannot delete course — ${activeEnrollments} students are currently enrolled.`),
            { code: 'HAS_ENROLLMENTS', status: 400 }
        );
    }
    const course = await Course.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!course) throw _notFound();
    return course;
};

/**
 * Get the enrolled student roster for a specific course.
 */
const getCourseRoster = async (courseId) => {
    const enrollments = await Enrollment.find({ course: courseId, status: 'enrolled' })
        .populate({
            path: 'student',
            select: 'rollNumber department semester batchYear',
            populate: { path: 'user', select: 'name email' },
        })
        .sort({ createdAt: -1 });
    return enrollments;
};

module.exports = {
    getAllCourses, getCourseById, getCoursesByFaculty,
    createCourse, updateCourse, deleteCourse, getCourseRoster,
};
