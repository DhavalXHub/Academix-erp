const submissionService = require('../services/submissionService');

const ok = (res, code, data, msg = 'Success') =>
    res.status(code).json({ success: true, message: msg, data, error: null });
const err = (res, e) =>
    res.status(e.status || 500).json({ success: false, data: null, error: { code: e.code || 'SERVER_ERROR', message: e.message } });

const submitAssignment = async (req, res) => {
    try {
        const { assignmentId, fileUrl } = req.body;
        if (!assignmentId || !fileUrl) {
            return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'assignmentId, fileUrl required.' } });
        }
        const submission = await submissionService.submitAssignment(req.user.id, assignmentId, fileUrl);
        return ok(res, 201, { submission }, 'Assignment submitted successfully.');
    } catch (e) { return err(res, e); }
};

const getSubmissionsForAssignment = async (req, res) => {
    try {
        const submissions = await submissionService.getSubmissionsForAssignment(req.user.id, req.params.assignmentId);
        return ok(res, 200, { submissions });
    } catch (e) { return err(res, e); }
};

const getMySubmission = async (req, res) => {
    try {
        const submission = await submissionService.getMySubmission(req.user.id, req.params.assignmentId);
        return ok(res, 200, { submission });
    } catch (e) { return err(res, e); }
};

const gradeSubmission = async (req, res) => {
    try {
        const { marksAwarded, feedback } = req.body;
        if (marksAwarded === undefined) {
             return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'marksAwarded is required.' } });
        }
        const submission = await submissionService.gradeSubmission(req.user.id, req.params.id, marksAwarded, feedback);
        return ok(res, 200, { submission }, 'Graded successfully.');
    } catch (e) { return err(res, e); }
};

module.exports = { submitAssignment, getSubmissionsForAssignment, getMySubmission, gradeSubmission };
