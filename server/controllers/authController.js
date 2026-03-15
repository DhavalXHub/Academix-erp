const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (for demo purposes, usually Admin only)
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        name,
        email,
        password,
        role
    });

    if (user) {
        // Create placeholder profile wrapper based on role
        if (role === 'student') {
            await Student.create({
                user: user._id,
                rollNumber: 'TEMP' + Date.now(), // Placeholder
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
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Validate Role
        if (user.role !== role) {
            return res.status(401).json({ message: 'Invalid role selected. Please check your role.' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

module.exports = { registerUser, loginUser };
