const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyProfile, updateMyProfile } = require('../controllers/profileController');

// @route  GET /api/v1/profile/me  → fetch own profile
// @route  PUT /api/v1/profile/me  → update own profile
router
    .route('/me')
    .get(protect, getMyProfile)
    .put(protect, updateMyProfile);

module.exports = router;
