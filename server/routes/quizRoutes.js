const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Create a new Quiz
// @route   POST /api/quizzes
router.post('/', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const { title, description, subjectId, timeLimitMinutes, questions } = req.body;

        // Find the faculty profile to use as createdBy
        const Faculty = require('../models/Faculty');
        let facultyProfile = await Faculty.findOne({ user: req.user.id });

        // If admin creates quiz, use a placeholder faculty reference (or self)
        // For simplicity, allow creating quiz without strict faculty reference for admin
        const quiz = await Quiz.create({
            title,
            description,
            subject: subjectId,
            createdBy: facultyProfile ? facultyProfile._id : req.user.id,
            timeLimitMinutes: parseInt(timeLimitMinutes),
            questions,
            isActive: true
        });

        res.status(201).json(quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get All Quizzes (faculty/admin management)
// @route   GET /api/quizzes
router.get('/', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const Faculty = require('../models/Faculty');
        const faculty = await Faculty.findOne({ user: req.user.id });
        let query = {};
        if (faculty && req.user.role === 'faculty') {
            query.createdBy = faculty._id;
        }
        const quizzes = await Quiz.find(query).populate('subject', 'name code');
        res.json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get Active Quizzes for students
// @route   GET /api/quizzes/active
router.get('/active', protect, authorize('student'), async (req, res) => {
    try {
        const quizzes = await Quiz.find({ isActive: true }).select('-questions.correctOptionIndex');
        res.json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get student's quiz attempt history
// @route   GET /api/quizzes/attempts/my
router.get('/attempts/my', protect, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const attempts = await QuizAttempt.find({ student: student._id })
            .populate('quiz', 'title timeLimitMinutes questions')
            .sort({ createdAt: -1 });

        res.json(attempts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get Single Quiz (with questions, for taking the quiz)
// @route   GET /api/quizzes/:id
router.get('/:id', protect, async (req, res) => {
    try {
        // Students don't see the correct answers
        let quiz;
        if (req.user.role === 'student') {
            quiz = await Quiz.findById(req.params.id).select('-questions.correctOptionIndex').populate('subject', 'name');
        } else {
            quiz = await Quiz.findById(req.params.id).populate('subject', 'name');
        }

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.json(quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Submit Quiz Answers
// @route   POST /api/quizzes/:id/submit
router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
    try {
        const { answers } = req.body; // Array of selected option indices
        // Fetch quiz WITH correct answers for grading
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const student = await Student.findOne({ user: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if already attempted
        const existingAttempt = await QuizAttempt.findOne({ quiz: quiz._id, student: student._id });
        if (existingAttempt) {
            return res.status(400).json({ message: 'You have already attempted this quiz', score: existingAttempt.score });
        }

        // Calculate Score
        let score = 0;
        quiz.questions.forEach((question, index) => {
            if (answers[index] !== undefined && answers[index] === question.correctOptionIndex) {
                score++;
            }
        });

        const attempt = await QuizAttempt.create({
            quiz: quiz._id,
            student: student._id,
            score,
            answers
        });

        res.json({
            message: 'Quiz Submitted Successfully',
            score,
            totalQuestions: quiz.questions.length,
            percentage: Math.round((score / quiz.questions.length) * 100),
            attempt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Toggle Quiz Active Status
// @route   PATCH /api/quizzes/:id/toggle
router.patch('/:id/toggle', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        quiz.isActive = !quiz.isActive;
        await quiz.save();
        res.json({ message: `Quiz ${quiz.isActive ? 'activated' : 'deactivated'}`, isActive: quiz.isActive });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
