const quizService = require('../services/quizService');

const ok = (res, code, data, msg = 'Success') => res.status(code).json({ success: true, message: msg, data, error: null });
const err = (res, e) => res.status(e.status || 500).json({ success: false, data: null, error: { code: e.code || 'SERVER_ERROR', message: e.message } });

const getQuizzesByCourse = async (req, res) => {
    try {
        const quizzes = await quizService.getQuizzesByCourse(req.user.id, req.user.role, req.params.courseId);
        return ok(res, 200, { quizzes });
    } catch (e) { return err(res, e); }
};

const createQuiz = async (req, res) => {
    try {
        const quiz = await quizService.createQuiz(req.user.id, req.body);
        return ok(res, 201, { quiz }, 'Quiz created successfully.');
    } catch (e) { return err(res, e); }
};

const updateQuiz = async (req, res) => {
    try {
        const quiz = await quizService.updateQuiz(req.user.id, req.params.id, req.body);
        return ok(res, 200, { quiz }, 'Quiz updated.');
    } catch (e) { return err(res, e); }
};

const deleteQuiz = async (req, res) => {
    try {
        await quizService.deleteQuiz(req.user.id, req.params.id);
        return ok(res, 200, null, 'Quiz deleted.');
    } catch (e) { return err(res, e); }
};

module.exports = { getQuizzesByCourse, createQuiz, updateQuiz, deleteQuiz };
