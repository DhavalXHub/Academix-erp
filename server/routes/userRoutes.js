const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all users
// @route   GET /api/users
router.get('/', protect, authorize('admin', 'faculty'), async (req, res) => {
    try {
        const { role } = req.query;
        let query = {};
        if (role) query.role = role;

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a new user (admin only)
// @route   POST /api/users
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const user = await User.create({ name, email, password, role });

        // Create role profile
        if (role === 'student') {
            await Student.create({
                user: user._id,
                rollNumber: 'STU' + Date.now(),
                department: 'General',
                semester: 1,
                batchYear: new Date().getFullYear()
            });
        } else if (role === 'faculty') {
            await Faculty.create({
                user: user._id,
                employeeId: 'EMP' + Date.now(),
                department: 'General',
                designation: 'Lecturer'
            });
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete a user (admin only)
// @route   DELETE /api/users/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (req.user.id === req.params.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // Remove associated profile
        if (user.role === 'student') {
            await Student.deleteOne({ user: user._id });
        } else if (user.role === 'faculty') {
            await Faculty.deleteOne({ user: user._id });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
