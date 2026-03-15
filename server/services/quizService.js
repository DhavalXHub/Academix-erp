const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const { notifyCourseStudents } = require('./notificationService');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });
const _notFound = (msg) => Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });

const getQuizzesByCourse = async (userId, userRole, courseId) => {
    // Basic access check
    if (userRole === 'faculty') {
        const faculty = await Faculty.findOne({ user: userId });
        if (!faculty) throw _bad('Faculty profile not found');
        const course = await Course.findById(courseId);
        if (!course || course.primaryFaculty.toString() !== faculty._id.toString()) {
            throw _bad('Not authorized to view quizzes for this course.');
        }
        return Quiz.find({ course: courseId }).sort({ createdAt: -1 });
    }

    if (userRole === 'student') {
        const student = await Student.findOne({ user: userId });
        if (!student) throw _bad('Student profile not found');
        const isEnrolled = await Enrollment.exists({ student: student._id, course: courseId, status: 'enrolled' });
        if (!isEnrolled) throw _bad('Must be enrolled to view quizzes.');
        
        // Students only see active quizzes
        // And we should omit correctOptionIndex from the response to prevent cheating
        return Quiz.find({ course: courseId, isActive: true }, { 'questions.correctOptionIndex': 0 }).sort({ createdAt: -1 });
    }

    if (userRole === 'admin') {
        return Quiz.find({ course: courseId }).sort({ createdAt: -1 });
    }
};

const createQuiz = async (userId, data) => {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _bad('Only faculty can create quizzes');

    const course = await Course.findById(data.courseId);
    if (!course || course.primaryFaculty.toString() !== faculty._id.toString()) {
        throw _bad('Not authorized to create quizzes for this course.');
    }

    const quiz = await Quiz.create({
        course: data.courseId,
        faculty: faculty._id,
        title: data.title,
        description: data.description || '',
        timeLimitMinutes: data.timeLimitMinutes,
        isActive: data.isActive || false,
        questions: data.questions || [],
    });

    if (quiz.isActive) {
        await notifyCourseStudents(data.courseId, 'quiz_created', `New Quiz Available: ${quiz.title}`, `/student/quizzes`);
    }

    return quiz;
};

const updateQuiz = async (userId, quizId, data) => {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _bad('Only faculty can update quizzes');

    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw _notFound('Quiz not found');
    if (quiz.faculty.toString() !== faculty._id.toString()) {
        throw _bad('You can only update your own quizzes.');
    }

    // Optional: block update if students have already started attempts?
    const hasAttempts = await QuizAttempt.exists({ quiz: quizId });
    if (hasAttempts && data.questions) {
        throw _bad('Cannot modify questions after students have started attempts.');
    }

    if (data.title) quiz.title = data.title;
    if (data.description !== undefined) quiz.description = data.description;
    if (data.timeLimitMinutes) quiz.timeLimitMinutes = data.timeLimitMinutes;
    if (data.isActive !== undefined) {
        if (!quiz.isActive && data.isActive) {
            // Became active
            await notifyCourseStudents(quiz.course.toString(), 'quiz_created', `New Quiz Available: ${quiz.title}`, `/student/quizzes`);
        }
        quiz.isActive = data.isActive;
    }
    if (data.questions && !hasAttempts) quiz.questions = data.questions;

    await quiz.save();
    return quiz;
};

const deleteQuiz = async (userId, quizId) => {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _bad('Only faculty can delete quizzes');

    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw _notFound('Quiz not found');
    if (quiz.faculty.toString() !== faculty._id.toString()) {
        throw _bad('You can only delete your own quizzes.');
    }

    await Quiz.findByIdAndDelete(quizId);
    // Optionally delete all attempts for this quiz
    await QuizAttempt.deleteMany({ quiz: quizId });
};

module.exports = {
    getQuizzesByCourse,
    createQuiz,
    updateQuiz,
    deleteQuiz,
};
