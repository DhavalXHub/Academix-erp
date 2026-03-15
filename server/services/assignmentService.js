const Assignment = require('../models/Assignment');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const { notifyCourseStudents } = require('./notificationService');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });
const _notFound = (msg) => Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });

const checkCourseAccess = async (userId, userRole, courseId) => {
    if (userRole === 'admin') return true;

    if (userRole === 'faculty') {
        const faculty = await Faculty.findOne({ user: userId });
        if (!faculty) throw _bad('Faculty profile not found.');
        const course = await Course.findById(courseId);
        if (!course) throw _notFound('Course not found.');
        if (course.primaryFaculty.toString() !== faculty._id.toString()) {
            throw _bad('You are not authorized to access this course.');
        }
        return faculty;
    }

    if (userRole === 'student') {
        const student = await Student.findOne({ user: userId });
        if (!student) throw _bad('Student profile not found.');
        const isEnrolled = await Enrollment.exists({ student: student._id, course: courseId, status: 'enrolled' });
        if (!isEnrolled) throw _bad('You must be enrolled in this course to access assignments.');
        return student;
    }
};

const getAssignmentsByCourse = async (userId, userRole, courseId) => {
    await checkCourseAccess(userId, userRole, courseId);
    return Assignment.find({ course: courseId }).sort({ dueDate: 1 });
};

const createAssignment = async (userId, courseId, data) => {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _bad('Only faculty can create assignments.');

    const course = await Course.findById(courseId);
    if (!course || course.primaryFaculty.toString() !== faculty._id.toString()) {
        throw _bad('You are not authorized to create assignments for this course.');
    }

    const assignment = await Assignment.create({
        course: courseId,
        faculty: faculty._id,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        maxMarks: data.maxMarks,
        attachmentUrl: data.attachmentUrl,
    });

    // Generate real-time notifications for enrolled students
    await notifyCourseStudents(courseId, 'assignment_created', `New Assignment: ${data.title}`, `/student/courses`);

    return assignment;
};

const deleteAssignment = async (userId, assignmentId) => {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _bad('Only faculty can delete assignments.');

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw _notFound('Assignment not found.');
    if (assignment.faculty.toString() !== faculty._id.toString()) {
        throw _bad('You can only delete your own assignments.');
    }

    await Assignment.findByIdAndDelete(assignmentId);
};

module.exports = {
    getAssignmentsByCourse,
    createAssignment,
    deleteAssignment,
};
