const express = require('express');
const router = express.Router();
const {
    loginUser,
    registerUser,
    refreshToken,
    logoutUser,
    getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route  POST /api/v1/auth/register
router.post('/register', registerUser);

// @route  POST /api/v1/auth/login
router.post('/login', loginUser);

// @route  POST /api/v1/auth/refresh
// Reads the HTTP-Only cookie; no Authorization header needed
router.post('/refresh', refreshToken);

// @route  POST /api/v1/auth/logout
// Requires a valid access token to identify WHO is logging out
router.post('/logout', protect, logoutUser);

// @route  GET /api/v1/auth/me
router.get('/me', protect, getMe);

module.exports = router;
