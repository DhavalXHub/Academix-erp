const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * POST /api/v1/timetable
 * Create new timetable entry (Admin only)
 */
router.post('/', authenticate, timetableController.createTimetable);

/**
 * GET /api/v1/timetable/student/:studentId
 * Get timetable for a student
 */
router.get('/student/:studentId', authenticate, timetableController.getTimetableByStudent);

/**
 * GET /api/v1/timetable/faculty/:facultyId
 * Get timetable for a faculty
 */
router.get('/faculty/:facultyId', authenticate, timetableController.getTimetableByFaculty);

/**
 * GET /api/v1/timetable
 * Get all timetable entries
 */
router.get('/', authenticate, timetableController.getAllTimetable);

/**
 * PUT /api/v1/timetable/:id
 * Update timetable entry
 */
router.put('/:id', authenticate, timetableController.updateTimetable);

/**
 * DELETE /api/v1/timetable/:id
 * Delete timetable entry
 */
router.delete('/:id', authenticate, timetableController.deleteTimetable);

module.exports = router;
