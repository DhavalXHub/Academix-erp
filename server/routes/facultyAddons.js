const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const LeaveRequest = require('../models/LeaveRequest');
const DoubtQuery = require('../models/DoubtQuery');
const Course = require('../models/Course');
const Student = require('../models/Student');

// ==========================================
// LEAVE REQUESTS
// ==========================================

// @desc    Get logged in faculty's leave requests
// @route   GET /api/v1/faculty-addons/leaves
router.get('/leaves', protect, authorize('faculty'), async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ faculty: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: { leaves } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
});

// @desc    Submit new leave request
// @route   POST /api/v1/faculty-addons/leaves
router.post('/leaves', protect, authorize('faculty'), async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason, alternativeClassArrangement } = req.body;
        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ success: false, error: { message: 'Missing fields' } });
        }

        const leave = await LeaveRequest.create({
            faculty: req.user.id,
            leaveType,
            startDate,
            endDate,
            reason,
            alternativeClassArrangement,
        });

        res.status(201).json({ success: true, data: { leave } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
});

// @desc    Get ALL leave requests (for admin review)
// @route   GET /api/v1/faculty-addons/leaves/admin
router.get('/leaves/admin', protect, authorize('admin'), async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({}).populate('faculty', 'name email').sort({ createdAt: -1 });
        res.json({ success: true, data: { leaves } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
});

// @desc    Approve/Reject leave request (admin only)
// @route   PATCH /api/v1/faculty-addons/leaves/admin/:id
router.patch('/leaves/admin/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, comments } = req.body;
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid status' } });
        }

        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ success: false, error: { message: 'Leave request not found' } });
        }

        leave.status = status;
        if (comments) leave.comments = comments;
        await leave.save();

        res.json({ success: true, data: { leave } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
});


// ==========================================
// DOUBT / QUERY SYSTEM
// ==========================================

// @desc    Get doubts by course (for faculty/admin)
// @route   GET /api/v1/faculty-addons/doubts/course/:courseId
router.get('/doubts/course/:courseId', protect, authorize('faculty', 'admin', 'student'), async (req, res) => {
    try {
        const doubts = await DoubtQuery.find({ course: req.params.courseId })
            .populate('student', 'name email')
            .populate('replies.user', 'name email role')
            .sort({ updatedAt: -1 });
        res.json({ success: true, data: { doubts } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
});

// @desc    Get doubts created by student
// @route   GET /api/v1/faculty-addons/doubts/student
router.get('/doubts/student', protect, authorize('student'), async (req, res) => {
    try {
        const doubts = await DoubtQuery.find({ student: req.user.id })
            .populate('course', 'code title')
            .populate('replies.user', 'name email role')
            .sort({ updatedAt: -1 });
        res.json({ success: true, data: { doubts } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
});

// @desc    Create new doubt ticket (student)
// @route   POST /api/v1/faculty-addons/doubts
router.post('/doubts', protect, authorize('student'), async (req, res) => {
    try {
        const { courseId, title, description } = req.body;
        if (!courseId || !title || !description) {
            return res.status(400).json({ success: false, error: { message: 'Missing fields' } });
        }

        const doubt = await DoubtQuery.create({
            student: req.user.id,
            course: courseId,
            title,
            description,
        });

        res.status(201).json({ success: true, data: { doubt } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
});

// @desc    Post reply to doubt
// @route   POST /api/v1/faculty-addons/doubts/:id/reply
router.post('/doubts/:id/reply', protect, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, error: { message: 'Reply message is required' } });
        }

        const doubt = await DoubtQuery.findById(req.params.id);
        if (!doubt) {
            return res.status(404).json({ success: false, error: { message: 'Doubt query not found' } });
        }

        doubt.replies.push({
            user: req.user.id,
            message,
        });

        await doubt.save();

        const populated = await DoubtQuery.findById(doubt._id)
            .populate('student', 'name email')
            .populate('replies.user', 'name email role');

        res.json({ success: true, data: { doubt: populated } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
});

// @desc    Resolve/Reopen doubt
// @route   PATCH /api/v1/faculty-addons/doubts/:id/status
router.patch('/doubts/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['open', 'resolved'].includes(status)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid status' } });
        }

        const doubt = await DoubtQuery.findById(req.params.id);
        if (!doubt) {
            return res.status(404).json({ success: false, error: { message: 'Doubt query not found' } });
        }

        doubt.status = status;
        await doubt.save();

        res.json({ success: true, data: { doubt } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
});


// ==========================================
// COURSE SYLLABUS PROGRESS TRACKING
// ==========================================

// @desc    Update course syllabus units and progress
// @route   PATCH /api/v1/faculty-addons/courses/:courseId/syllabus
router.patch('/courses/:courseId/syllabus', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const { syllabusUnits } = req.body;
        if (!syllabusUnits || !Array.isArray(syllabusUnits)) {
            return res.status(400).json({ success: false, error: { message: 'Syllabus units array is required' } });
        }

        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ success: false, error: { message: 'Course not found' } });
        }

        // Calculate progress percentage based on completed units
        const completedCount = syllabusUnits.filter(unit => unit.isCompleted).length;
        const progressPercentage = Math.round((completedCount / syllabusUnits.length) * 100);

        course.syllabusUnits = syllabusUnits;
        course.syllabusProgress = progressPercentage;
        await course.save();

        res.json({ success: true, data: { course } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: { message: 'Server Error' } });
    }
});

module.exports = router;
