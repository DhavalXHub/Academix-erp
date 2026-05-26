const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get ALL faculty profiles (for admin dropdowns — assigns faculty to courses)
// @route   GET /api/v1/faculty
router.get('/', protect, authorize('admin', 'faculty'), async (req, res) => {
    try {
        const faculties = await Faculty.find({})
            .populate('user', 'name email')
            .sort({ lastName: 1 });
        // Shape: { _id: Faculty._id, name, email, department } — what CourseFormModal expects
        const shaped = faculties.map(f => ({
            _id: f._id,
            name: f.user?.name || `${f.firstName} ${f.lastName}`,
            email: f.user?.email || f.email,
            department: f.department,
            designation: f.designation,
        }));
        res.json({ success: true, data: { faculties: shaped } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
});

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
