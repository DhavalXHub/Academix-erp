const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all students (for faculty use - attendance marking, grading)
// @route   GET /api/faculty/students
router.get('/students', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const students = await Student.find().populate('user', 'name email').sort({ rollNumber: 1 });
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get subjects (for faculty dropdowns)
// @route   GET /api/faculty/subjects
router.get('/subjects', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.json(subjects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
