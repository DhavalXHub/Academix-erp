const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Invoice = require('../models/Invoice');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalFaculty = await User.countDocuments({ role: 'faculty' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });

        const allInvoices = await Invoice.find();
        const totalRevenue = allInvoices
            .filter(i => i.status === 'Paid')
            .reduce((sum, i) => sum + i.amount, 0);
        const pendingInvoices = allInvoices.filter(i => i.status !== 'Paid').length;

        res.json({
            totalStudents,
            totalFaculty,
            totalAdmins,
            totalRevenue,
            pendingInvoices
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
