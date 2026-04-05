const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const User = require('../models/User');

// ── Helpers ───────────────────────────────────────────────────────────────────
const _notFound = (msg) => Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });
const _conflict = (msg) => Object.assign(new Error(msg), { code: 'CONFLICT', status: 409 });
const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });

const currentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-based
    // Academic year starts in July (month 7)
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

// ── Enrollment Service ─────────────────────────────────────────────────────────

/**
 * Enroll a student in a course for the current academic year.
 * Enforces: course active, not already enrolled, enrollment cap.
 */
const enrollStudent = async (userId, courseId) => {
    const studentUser = await User.findById(userId);
    if (!studentUser || studentUser.role !== 'student') throw _notFound('Student profile not found.');

    const course = await Course.findById(courseId);
    if (!course) throw _notFound('Course not found.');
    if (!course.isActive) throw _bad('This course is no longer accepting enrollments.');

    const year = currentAcademicYear();

    // Duplicate enrollment check
    const existing = await Enrollment.findOne({ student: studentUser._id, course: courseId, academicYear: year });
    if (existing) {
        if (existing.status === 'enrolled') throw _conflict('You are already enrolled in this course.');
        if (existing.status === 'dropped') {
            // Re-enroll
            existing.status = 'enrolled';
            await existing.save();
            return existing.populate([
                { path: 'course', select: 'code title credits department semester' },
                { path: 'student' },
            ]);
        }
    }

    // Enrollment cap check
    const currentCount = await Enrollment.countDocuments({ course: courseId, academicYear: year, status: 'enrolled' });
    if (currentCount >= course.maxEnrollment) {
        throw _bad(`This course has reached its enrollment limit of ${course.maxEnrollment} students.`);
    }

    const enrollment = await Enrollment.create({
        student: studentUser._id,
        course: courseId,
        academicYear: year,
        semester: course.semester,
    });

    return Enrollment.findById(enrollment._id)
        .populate('course', 'code title credits department semester description')
        .populate('student', 'name email');
};

/**
 * Drop a student's enrollment from a course.
 */
const dropCourse = async (userId, enrollmentId) => {
    const studentUser = await User.findById(userId);
    if (!studentUser) throw _notFound('Student profile not found.');

    const enrollment = await Enrollment.findOne({ _id: enrollmentId, student: studentUser._id });
    if (!enrollment) throw _notFound('Enrollment record not found.');
    if (enrollment.status === 'dropped') throw _bad('This course is already dropped.');

    enrollment.status = 'dropped';
    await enrollment.save();
    return enrollment;
};

/**
 * Get all active enrollments for the currently logged-in student.
 */
const getMyCourses = async (userId) => {
    const studentUser = await User.findById(userId);
    if (!studentUser) throw _notFound('Student profile not found.');

    return Enrollment.find({ student: studentUser._id, status: 'enrolled' })
        .populate('course', 'code title credits department semester description primaryFaculty')
        .populate({
            path: 'course',
            populate: {
                path: 'primaryFaculty',
                select: 'name email',
            },
        })
        .sort({ createdAt: -1 });
};

/**
 * Get all courses taught by the currently logged-in faculty member.
 */
const getMyTaughtCourses = async (userId) => {
    const courses = await Course.find({ primaryFaculty: userId, isActive: true })
        .sort({ semester: 1, code: 1 });

    // Annotate each course with enrolled student count
    const annotated = await Promise.all(
        courses.map(async (c) => {
            const count = await Enrollment.countDocuments({
                course: c._id,
                status: 'enrolled',
                academicYear: currentAcademicYear(),
            });
            return { ...c.toObject(), enrolledCount: count };
        })
    );
    return annotated;
};

module.exports = { enrollStudent, dropCourse, getMyCourses, getMyTaughtCourses };
