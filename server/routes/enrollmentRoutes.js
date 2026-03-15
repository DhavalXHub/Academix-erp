const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    enrollInCourse, dropCourse, getMyCourses, getTeachingCourses,
} = require('../controllers/enrollmentController');

// Student: enroll in a course
router.post('/', protect, authorize('student'), enrollInCourse);

// Student: view all their enrolled courses
router.get('/my-courses', protect, authorize('student'), getMyCourses);

// Faculty: view all courses they teach (with enrollment counts)
router.get('/teaching', protect, authorize('faculty'), getTeachingCourses);

// Student: drop an enrolled course
router.delete('/:id', protect, authorize('student'), dropCourse);

module.exports = router;
