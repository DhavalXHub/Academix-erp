const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { handleUploadSingle } = require('../middleware/uploadMiddleware');
const {
    getCalendars,
    uploadCalendar,
    getCalendarFile,
    deleteCalendar,
} = require('../controllers/academicCalendarController');

router.get('/', protect, getCalendars);
router.get('/:id/file', protect, getCalendarFile);
router.post('/', protect, authorize('admin'), handleUploadSingle, uploadCalendar);
router.delete('/:id', protect, authorize('admin'), deleteCalendar);

module.exports = router;
