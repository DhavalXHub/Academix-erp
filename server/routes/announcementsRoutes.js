const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all announcements
// @route   GET /api/announcements
router.get('/', protect, async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        // Filter by audience: if student, exclude faculty-only notices
        if (req.user.role === 'student') {
            query.targetAudience = { $in: ['all', 'student'] };
        } else if (req.user.role === 'faculty') {
            query.targetAudience = { $in: ['all', 'faculty'] };
        }

        const notices = await Notice.find(query)
            .sort({ createdAt: -1 })
            .populate('postedBy', 'name role');

        res.json(notices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create announcement
// @route   POST /api/announcements
router.post('/', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const { title, content, category, targetAudience } = req.body;

        const notice = await Notice.create({
            title,
            content,
            category: category || 'General',
            postedBy: req.user.id,
            targetAudience: targetAudience || 'all'
        });

        res.status(201).json(notice);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const notice = await Notice.findByIdAndDelete(req.params.id);
        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }
        res.json({ message: 'Notice deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
