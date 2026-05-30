const CourseMaterial = require('../models/CourseMaterial');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const ApiError = require('../utils/ApiError');
const fs = require('fs');
const { normalizePublicUploadPath, resolveUploadedFilePath, toPublicUploadPath } = require('../utils/uploadStorage');

/**
 * Verify access to a course's materials.
 * Admin: always. Faculty: must be primaryFaculty. Student: must be enrolled.
 */
const checkCourseAccess = async (userId, userRole, courseId) => {
    if (userRole === 'admin') return true;
    if (userRole === 'faculty') {
        const course = await Course.findById(courseId);
        if (!course) throw ApiError.notFound('Course not found.');
        if (!course.primaryFaculty || course.primaryFaculty.toString() !== userId.toString()) {
            throw ApiError.forbidden('You are not assigned to this course.');
        }
        return true;
    }
    if (userRole === 'student') {
        const isEnrolled = await Enrollment.exists({ student: userId, course: courseId, status: 'enrolled' });
        if (!isEnrolled) throw ApiError.forbidden('You must be enrolled to access course materials.');
        return true;
    }
};

// GET /api/v1/materials/course/:courseId
const getMaterialsByCourse = async (userId, userRole, courseId) => {
    await checkCourseAccess(userId, userRole, courseId);

    const query = userRole === 'student'
        ? { course: courseId, isVisible: true }
        : { course: courseId };

    return CourseMaterial.find(query)
        .populate('faculty', 'name email')
        .sort({ isPinned: -1, uploadedAt: -1 });
};

// POST /api/v1/materials/upload — multipart/form-data (real file)
const uploadMaterialFile = async (userId, courseId, fileInfo, metadata) => {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found.');
    if (!course.primaryFaculty || course.primaryFaculty.toString() !== userId.toString()) {
        throw ApiError.forbidden('You are not assigned to this course.');
    }

    const fileUrl = toPublicUploadPath(`materials/${fileInfo.filename}`);

    const material = await CourseMaterial.create({
        course: courseId,
        faculty: userId,
        title: metadata.title || fileInfo.originalname,
        description: metadata.description || '',
        fileUrl,
        fileName: fileInfo.originalname,
        fileSize: fileInfo.size,
        mimeType: fileInfo.mimetype,
        isExternalLink: false,
        category: metadata.category || 'notes',
        module: metadata.module || 'General',
        isPinned: false,
        isVisible: true,
    });

    try {
        const { notifyCourseStudents } = require('./notificationService');
        const courseCode = course.code || 'Course';
        notifyCourseStudents(
            courseId,
            'material_added',
            `📚 New Resource: "${material.title}" has been uploaded in ${courseCode}.`,
            `/student/courses/${courseId}`
        );
    } catch (err) {
        console.error('[Notification Error] Failed to send material notification:', err.message);
    }

    return material;
};

// POST /api/v1/materials — external link (JSON body)
const uploadMaterialLink = async (userId, courseId, data) => {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found.');
    if (!course.primaryFaculty || course.primaryFaculty.toString() !== userId.toString()) {
        throw ApiError.forbidden('You are not assigned to this course.');
    }

    const material = await CourseMaterial.create({
        course: courseId,
        faculty: userId,
        title: data.title,
        description: data.description || '',
        fileUrl: data.fileUrl,
        fileName: data.title,
        isExternalLink: true,
        category: data.category || 'other',
        module: data.module || 'General',
    });

    try {
        const { notifyCourseStudents } = require('./notificationService');
        const courseCode = course.code || 'Course';
        notifyCourseStudents(
            courseId,
            'material_added',
            `🔗 New Resource Link: "${material.title}" has been added in ${courseCode}.`,
            `/student/courses/${courseId}`
        );
    } catch (err) {
        console.error('[Notification Error] Failed to send material notification:', err.message);
    }

    return material;
};

// PATCH /api/v1/materials/:id — update metadata
const updateMaterial = async (userId, materialId, updates) => {
    const material = await CourseMaterial.findById(materialId);
    if (!material) throw ApiError.notFound('Material not found.');
    if (material.faculty.toString() !== userId.toString()) {
        throw ApiError.forbidden('You can only edit your own materials.');
    }
    const allowed = ['title', 'description', 'category', 'module', 'isPinned', 'isVisible'];
    allowed.forEach(key => { if (updates[key] !== undefined) material[key] = updates[key]; });
    await material.save();
    return material;
};

// DELETE /api/v1/materials/:id
const deleteMaterial = async (userId, userRole, materialId) => {
    const material = await CourseMaterial.findById(materialId);
    if (!material) throw ApiError.notFound('Material not found.');
    if (userRole !== 'admin' && material.faculty.toString() !== userId.toString()) {
        throw ApiError.forbidden('You can only delete your own materials.');
    }
    // Delete physical file if it exists
    if (!material.isExternalLink && material.fileUrl) {
        try {
            const filePath = resolveUploadedFilePath(normalizePublicUploadPath(material.fileUrl));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
            console.warn('[Material Delete] Could not delete physical file:', e.message);
        }
    }
    await CourseMaterial.findByIdAndDelete(materialId);
};

// POST /api/v1/materials/:id/track-download — increment download count
const trackDownload = async (materialId) => {
    await CourseMaterial.findByIdAndUpdate(materialId, { $inc: { downloadCount: 1 } });
};

module.exports = {
    getMaterialsByCourse,
    uploadMaterialFile,
    uploadMaterialLink,
    updateMaterial,
    deleteMaterial,
    trackDownload,
};
