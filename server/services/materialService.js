const CourseMaterial = require('../models/CourseMaterial');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });
const _notFound = (msg) => Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });

// Determine if a user has access to a course's materials
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
        if (!isEnrolled) throw _bad('You must be enrolled in this course to access materials.');
        return student;
    }
};

const getMaterialsByCourse = async (userId, userRole, courseId) => {
    await checkCourseAccess(userId, userRole, courseId);
    return CourseMaterial.find({ course: courseId }).sort({ uploadedAt: -1 });
};

const uploadMaterial = async (userId, courseId, data) => {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _bad('Only faculty can upload materials.');

    const course = await Course.findById(courseId);
    if (!course || course.primaryFaculty.toString() !== faculty._id.toString()) {
        throw _bad('You are not authorized to upload to this course.');
    }

    return CourseMaterial.create({
        course: courseId,
        faculty: faculty._id,
        title: data.title,
        description: data.description,
        fileUrl: data.fileUrl,
        type: data.type || 'other',
    });
};

const deleteMaterial = async (userId, materialId) => {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _bad('Only faculty can delete materials.');

    const material = await CourseMaterial.findById(materialId);
    if (!material) throw _notFound('Material not found.');
    if (material.faculty.toString() !== faculty._id.toString()) {
        throw _bad('You can only delete your own materials.');
    }

    await CourseMaterial.findByIdAndDelete(materialId);
};

module.exports = {
    getMaterialsByCourse,
    uploadMaterial,
    deleteMaterial,
};
