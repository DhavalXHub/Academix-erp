const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });
const _notFound = (msg) => Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });

const submitAssignment = async (userId, assignmentId, fileUrl) => {
    const student = await Student.findOne({ user: userId });
    if (!student) throw _bad('Only students can submit assignments.');

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw _notFound('Assignment not found.');

    const isEnrolled = await Enrollment.exists({ student: student._id, course: assignment.course, status: 'enrolled' });
    if (!isEnrolled) throw _bad('You must be enrolled in the course to submit this assignment.');

    // Upsert or throw error on duplicate? The prompt says "store only the fileUrl". We can allow resubmission until due date.
    // Let's do an upsert so students can overwrite their submission if they made a mistake
    let submission = await Submission.findOne({ assignment: assignmentId, student: student._id });
    
    if (submission) {
        submission.fileUrl = fileUrl;
        submission.submittedAt = Date.now();
        await submission.save();
    } else {
        submission = await Submission.create({
            assignment: assignmentId,
            student: student._id,
            fileUrl,
        });
    }

    return submission;
};

// Faculty fetching all submissions for their assignment
const getSubmissionsForAssignment = async (userId, assignmentId) => {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _bad('Only faculty can access this.');

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw _notFound('Assignment not found.');
    if (assignment.faculty.toString() !== faculty._id.toString()) {
        throw _bad('You are not authorized to view these submissions.');
    }

    return Submission.find({ assignment: assignmentId })
        .populate({
            path: 'student',
            select: 'rollNumber user',
            populate: { path: 'user', select: 'name email' }
        })
        .sort({ submittedAt: -1 });
};

// Student fetching their own submission
const getMySubmission = async (userId, assignmentId) => {
    const student = await Student.findOne({ user: userId });
    if (!student) throw _bad('Student profile not found.');

    return Submission.findOne({ assignment: assignmentId, student: student._id });
};

// Faculty grades a submission
const gradeSubmission = async (userId, submissionId, marksAwarded, feedback) => {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _bad('Only faculty can access this.');

    const submission = await Submission.findById(submissionId).populate('assignment');
    if (!submission) throw _notFound('Submission not found.');
    
    if (submission.assignment.faculty.toString() !== faculty._id.toString()) {
         throw _bad('You are not authorized to grade this submission.');
    }

    if (marksAwarded > submission.assignment.maxMarks) {
        throw _bad(`Marks cannot exceed the max marks: ${submission.assignment.maxMarks}`);
    }

    submission.marksAwarded = marksAwarded;
    submission.feedback = feedback || '';
    await submission.save();

    return submission.populate({
        path: 'student',
        select: 'rollNumber user',
        populate: { path: 'user', select: 'name' }
    });
};

module.exports = {
    submitAssignment,
    getSubmissionsForAssignment,
    getMySubmission,
    gradeSubmission,
};
