const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Mark Attendance (bulk)
// @route   POST /api/attendance
router.post('/', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const { studentId, status, date, subjectId } = req.body;

        const studentProfile = await Student.findOne({ user: studentId });
        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        // Upsert: update if exists, create if not
        const attendance = await Attendance.findOneAndUpdate(
            {
                student: studentProfile._id,
                subject: subjectId,
                date: new Date(date)
            },
            {
                student: studentProfile._id,
                subject: subjectId,
                date: new Date(date),
                status,
                markedBy: req.user.id
            },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: 'Attendance Marked Successfully', attendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get Attendance for logged in student (monthly)
// @route   GET /api/attendance/my
router.get('/my', protect, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const { month, year } = req.query;
        let query = { student: student._id };

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendanceRecords = await Attendance.find(query)
            .populate('subject', 'name code')
            .sort({ date: -1 });

        res.json(attendanceRecords);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get Subject-wise Attendance Summary for logged in student
// @route   GET /api/attendance/subject-summary
router.get('/subject-summary', protect, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const records = await Attendance.find({ student: student._id })
            .populate('subject', 'name code');

        // Group by subject
        const subjectMap = {};
        records.forEach(record => {
            const subId = record.subject._id.toString();
            if (!subjectMap[subId]) {
                subjectMap[subId] = {
                    subject: record.subject,
                    total: 0,
                    present: 0,
                    absent: 0
                };
            }
            subjectMap[subId].total++;
            if (record.status === 'Present') {
                subjectMap[subId].present++;
            } else {
                subjectMap[subId].absent++;
            }
        });

        const summary = Object.values(subjectMap).map(s => ({
            ...s,
            percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
        }));

        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get All Attendance (for faculty/admin)
// @route   GET /api/attendance/all
router.get('/all', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const { studentId, subjectId, date } = req.query;
        let query = {};

        if (studentId) {
            const student = await Student.findOne({ user: studentId });
            if (student) query.student = student._id;
        }
        if (subjectId) query.subject = subjectId;
        if (date) {
            const d = new Date(date);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            query.date = { $gte: d, $lt: nextDay };
        }

        const records = await Attendance.find(query)
            .populate('student', 'rollNumber')
            .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
            .populate('subject', 'name code')
            .sort({ date: -1 });

        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
