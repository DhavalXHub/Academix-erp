const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');

// ── Helpers ───────────────────────────────────────────────────────────────────

const _notFound = (msg = 'Course not found.') =>
    Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });

const _conflict = (msg) =>
    Object.assign(new Error(msg), { code: 'CONFLICT', status: 409 });

// Reusable populate config: Faculty → User name/email
const FACULTY_POPULATE = {
    path: 'primaryFaculty',
    select: 'firstName lastName email department designation user',
    populate: { path: 'user', select: 'name email' },
};

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
            .populate(FACULTY_POPULATE)
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
    const course = await Course.findById(id).populate(FACULTY_POPULATE);
    if (!course) throw _notFound();
    return course;
};

/**
 * Get all courses taught by a specific faculty member (by Faculty._id).
 */
const getCoursesByFaculty = async (facultyId) => {
    return Course.find({ primaryFaculty: facultyId, isActive: true })
        .populate(FACULTY_POPULATE)
        .sort({ semester: 1, code: 1 });
};

/**
 * Create a new course. Code must be globally unique.
 */
const createCourse = async (data) => {
    const code = data.code?.toUpperCase();
    const existing = await Course.findOne({ code });
    if (existing) throw _conflict(`A course with code '${code}' already exists.`);
    const course = await Course.create({ ...data, code });
    return Course.findById(course._id).populate(FACULTY_POPULATE);
};

/**
 * Update course fields. Admin only.
 */
const updateCourse = async (id, updates) => {
    // Prevent changing the course code via update
    const safeUpdates = { ...updates };
    delete safeUpdates.code;

    const course = await Course.findByIdAndUpdate(id, safeUpdates, { new: true, runValidators: true })
        .populate(FACULTY_POPULATE);
    if (!course) throw _notFound();
    return course;
};

/**
 * Soft-delete (deactivate) a course. Sets isActive: false.
 * Students remain enrolled but course won't appear in active listings.
 */
const deleteCourse = async (id) => {
    const course = await Course.findByIdAndUpdate(id, { isActive: false }, { new: true })
        .populate(FACULTY_POPULATE);
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
            select: 'rollNumber department semester batchYear firstName lastName email',
            populate: { path: 'user', select: 'name email' },
        })
        .sort({ createdAt: -1 });
    return enrollments;
};

module.exports = {
    getAllCourses, getCourseById, getCoursesByFaculty,
    createCourse, updateCourse, deleteCourse, getCourseRoster,
};
