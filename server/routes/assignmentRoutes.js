const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getAssignmentsByCourse,
    createAssignment,
    deleteAssignment,
} = require('../controllers/assignmentController');

// Any authenticated user can view (auth checked in service)
router.get('/course/:courseId', protect, getAssignmentsByCourse);

// Only faculty creates/deletes assignments
router.post('/', protect, authorize('faculty'), createAssignment);
router.delete('/:id', protect, authorize('faculty'), deleteAssignment);

module.exports = router;
