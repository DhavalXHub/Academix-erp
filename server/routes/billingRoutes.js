const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get Invoices for logged in student
// @route   GET /api/billing/my
router.get('/my', protect, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const invoices = await Invoice.find({ student: student._id }).sort({ dueDate: 1 });
        res.json(invoices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Pay an invoice
// @route   POST /api/billing/pay/:id
router.post('/pay/:id', protect, authorize('student'), async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check if invoice belongs to student
        const student = await Student.findOne({ user: req.user.id });
        if (invoice.student.toString() !== student._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (invoice.status === 'Paid') {
            return res.status(400).json({ message: 'Invoice already paid' });
        }

        // Mock Payment Processing
        invoice.status = 'Paid';
        invoice.paidAt = Date.now();
        await invoice.save();

        res.json({ message: 'Payment Successful', invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
