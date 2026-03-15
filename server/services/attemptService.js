const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const Faculty = require('../models/Faculty');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });
const _notFound = (msg) => Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });

const startQuiz = async (userId, quizId) => {
    const student = await Student.findOne({ user: userId });
    if (!student) throw _bad('Only students can attempt quizzes.');

    const quiz = await Quiz.findById(quizId);
    if (!quiz || !quiz.isActive) throw _notFound('Active quiz not found.');

    const isEnrolled = await Enrollment.exists({ student: student._id, course: quiz.course, status: 'enrolled' });
    if (!isEnrolled) throw _bad('You must be enrolled to take this quiz.');

    // Enforce 1 attempt
    let attempt = await QuizAttempt.findOne({ quiz: quizId, student: student._id });
    if (attempt) {
        // If already completed
        if (attempt.endTime) throw _bad('You have already completed this quiz.');
        // If still active
        return attempt; 
    }

    attempt = await QuizAttempt.create({
        quiz: quizId,
        student: student._id,
        startTime: Date.now(),
        endTime: null,
        answers: {},
        score: 0
    });

    return attempt;
};

const submitQuiz = async (userId, quizId, answers) => {
    const student = await Student.findOne({ user: userId });
    if (!student) throw _bad('Only students can submit quizzes.');

    const attempt = await QuizAttempt.findOne({ quiz: quizId, student: student._id });
    if (!attempt) throw _notFound('Active attempt not found. Please start the quiz first.');
    if (attempt.endTime) throw _bad('Quiz has already been submitted.');

    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw _notFound('Quiz not found.');

    // Check time limit with a small grace period (e.g. 1 minute)
    const now = Date.now();
    const elapsedTimeMin = (now - attempt.startTime.getTime()) / 60000;
    if (elapsedTimeMin > quiz.timeLimitMinutes + 2) {
        // Force submit with no further answers recorded if they bypassed client timer
        attempt.endTime = now;
        await attempt.save();
        throw _bad('Time limit exceeded. Your previous answers have been submitted automatically.');
    }

    // Calculate score
    let score = 0;
    const recordedAnswers = { ...attempt.answers }; // Keep previous if they only sent partial, though client usually sends full state
    
    // answers expected to be an object map: { questionId: selectedIndex }
    for (const [qId, selectedIdx] of Object.entries(answers)) {
        recordedAnswers[qId] = selectedIdx;
    }

    for (const q of quiz.questions) {
        // Mongoose maps keys are strings, values are the type
        const answerVal = recordedAnswers[q._id.toString()];
        if (answerVal !== undefined && answerVal === q.correctOptionIndex) {
            score += 1; // Assuming 1 mark per question for simplicity right now
        }
    }

    attempt.answers = recordedAnswers;
    attempt.score = score;
    attempt.endTime = now;

    await attempt.save();

    return {
        score,
        totalQuestions: quiz.questions.length,
        attemptId: attempt._id
    };
};

const getMyAttempts = async (userId) => {
    const student = await Student.findOne({ user: userId });
    if (!student) throw _bad('Only students can fetch their attempts.');

    return QuizAttempt.find({ student: student._id })
        .populate('quiz', 'title course timeLimitMinutes')
        .sort({ startTime: -1 });
};

const getQuizAttemptsForFaculty = async (userId, quizId) => {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _bad('Only faculty can view attempts.');

    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw _notFound('Quiz not found.');
    if (quiz.faculty.toString() !== faculty._id.toString()) {
        throw _bad('Unauthorized to view this quiz.');
    }

    return QuizAttempt.find({ quiz: quizId })
        .populate({
            path: 'student',
            select: 'rollNumber user',
            populate: { path: 'user', select: 'name email' }
        })
        .sort({ score: -1 });
};

module.exports = {
    startQuiz,
    submitQuiz,
    getMyAttempts,
    getQuizAttemptsForFaculty,
};
