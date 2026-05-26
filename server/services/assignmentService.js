const Assignment = require('../models/Assignment');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const { notifyCourseStudents } = require('./notificationService');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });
const _notFound = (msg) => Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });

/**
 * Resolve User._id → Faculty._id for authorization checks.
 * Course.primaryFaculty stores Faculty._id (ref: 'Faculty').
 */
const getFacultyId = async (userId) => {
    const faculty = await Faculty.findOne({ user: userId });
    return faculty?._id || null;
};

const checkCourseAccess = async (userId, userRole, courseId) => {
    if (userRole === 'admin') return true;

    if (userRole === 'faculty') {
        const course = await Course.findById(courseId);
        if (!course) throw _notFound('Course not found.');
        const facultyId = await getFacultyId(userId);
        if (!facultyId || !course.primaryFaculty || course.primaryFaculty.toString() !== facultyId.toString()) {
            throw _bad('You are not authorized to access this course.');
        }
        return { _id: facultyId };
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
    const course = await Course.findById(courseId);
    if (!course) throw _notFound('Course not found.');

    // primaryFaculty stores Faculty._id — resolve userId → Faculty._id to compare
    const facultyId = await getFacultyId(userId);
    if (!facultyId || !course.primaryFaculty || course.primaryFaculty.toString() !== facultyId.toString()) {
        throw _bad('You are not authorized to create assignments for this course.');
    }

    // Assignment.faculty refs User — store User._id
    const assignment = await Assignment.create({
        course: courseId,
        faculty: userId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        maxMarks: data.maxMarks,
        attachmentUrl: data.attachmentUrl,
    });

    // Notify all enrolled students in real-time
    await notifyCourseStudents(
        courseId,
        'assignment_created',
        `📋 New Assignment: "${data.title}" — due ${new Date(data.dueDate).toLocaleDateString('en-IN')}`,
        '/student/assignments'
    );

    return assignment;
};

const updateAssignment = async (userId, assignmentId, data) => {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw _notFound('Assignment not found.');
    // Assignment.faculty stores User._id
    if (assignment.faculty.toString() !== userId.toString()) {
        throw _bad('You can only edit your own assignments.');
    }

    if (data.title !== undefined) assignment.title = data.title;
    if (data.description !== undefined) assignment.description = data.description;
    if (data.dueDate !== undefined) assignment.dueDate = data.dueDate;
    if (data.maxMarks !== undefined) assignment.maxMarks = data.maxMarks;
    if (data.attachmentUrl !== undefined) assignment.attachmentUrl = data.attachmentUrl;

    await assignment.save();

    await notifyCourseStudents(
        assignment.course.toString(),
        'assignment_created',
        `✏️ Assignment Updated: "${assignment.title}" — check the new details.`,
        '/student/assignments'
    );

    return assignment;
};

const deleteAssignment = async (userId, assignmentId) => {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw _notFound('Assignment not found.');
    if (assignment.faculty.toString() !== userId.toString()) {
        throw _bad('You can only delete your own assignments.');
    }
    await Assignment.findByIdAndDelete(assignmentId);
};

module.exports = {
    getAssignmentsByCourse,
    createAssignment,
    updateAssignment,
    deleteAssignment,
};
