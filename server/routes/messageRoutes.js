const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    sendMessage,
    getConversation,
    markMessageRead,
    markConversationRead,
    getUnreadCounts,
} = require('../controllers/messageController');

router.post('/', protect, sendMessage);
router.get('/unread/counts', protect, getUnreadCounts);
router.get('/:userId', protect, getConversation);
router.put('/:id/read', protect, markMessageRead);
router.put('/conversation/:userId/read', protect, markConversationRead);

module.exports = router;
