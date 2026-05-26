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
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw _notFound('Assignment not found.');

    // assignment.faculty stores Faculty._id or User._id (see assignmentService)
    // Check ownership: try Faculty profile first, fall back to direct userId comparison
    const faculty = await Faculty.findOne({ user: userId });
    const facultyRef = faculty?._id?.toString();
    const assignFacRef = assignment.faculty?.toString();

    if (assignFacRef !== facultyRef && assignFacRef !== userId.toString()) {
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
    const submission = await Submission.findById(submissionId).populate('assignment');
    if (!submission) throw _notFound('Submission not found.');

    // Check ownership via Faculty profile or direct User._id
    const faculty = await Faculty.findOne({ user: userId });
    const facultyRef = faculty?._id?.toString();
    const assignFacRef = submission.assignment?.faculty?.toString();

    if (assignFacRef !== facultyRef && assignFacRef !== userId.toString()) {
        throw _bad('You are not authorized to grade this submission.');
    }

    if (marksAwarded > submission.assignment.maxMarks) {
        throw _bad(`Marks cannot exceed the max marks: ${submission.assignment.maxMarks}`);
    }

    submission.marksAwarded = marksAwarded;
    submission.feedback = feedback || '';
    await submission.save();

    await submission.populate({
        path: 'student',
        select: 'rollNumber user',
        populate: { path: 'user', select: 'name' }
    });

    const { createDirectNotification } = require('./notificationService');
    const studentUserId = submission.student.user._id || submission.student.user;
    await createDirectNotification(studentUserId, 'submission_graded', `Your submission for ${submission.assignment.title} was graded: ${marksAwarded} marks.`, '/student/assignments');

    return submission;
};

// Student fetching all their submissions
const getAllMySubmissions = async (userId) => {
    const student = await Student.findOne({ user: userId });
    if (!student) throw _bad('Student profile not found.');

    return Submission.find({ student: student._id })
        .populate({
            path: 'assignment',
            select: 'title maxMarks dueDate course description',
            populate: { path: 'course', select: 'code title' }
        })
        .sort({ submittedAt: -1 });
};

module.exports = {
    submitAssignment,
    getSubmissionsForAssignment,
    getMySubmission,
    getAllMySubmissions,
    gradeSubmission,
};
