const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyUserCredentials,
    saveRefreshToken,
    validateRefreshToken,
    revokeRefreshToken,
} = require('../services/authService');
const jwt = require('jsonwebtoken');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Set the refresh token as an HTTP-only Secure cookie.
 * This prevents JavaScript (XSS) from reading it.
 */
const setRefreshTokenCookie = (res, token) => {
    res.cookie('academix_refresh', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
};

// ── Standardized Response Helpers ────────────────────────────────────────────
const sendSuccess = (res, statusCode, data, message = 'Success') => {
    return res.status(statusCode).json({ success: true, message, data, error: null });
};

const sendError = (res, statusCode, message, code = 'ERROR') => {
    return res.status(statusCode).json({ success: false, data: null, error: { code, message } });
};

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Authenticate user & return access token + set refresh cookie
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return sendError(res, 400, 'Email, password, and role are required.', 'MISSING_FIELDS');
        }

        const user = await verifyUserCredentials(email, password, role);

        if (!user) {
            return sendError(res, 401, 'Invalid credentials or role.', 'AUTH_FAILED');
        }

        if (!user.isActive) {
            return sendError(res, 403, 'Your account has been deactivated.', 'ACCOUNT_INACTIVE');
        }

        // Issue tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken();

        // Persist hashed refresh token + update lastLogin in DB
        await saveRefreshToken(user._id, refreshToken);

        // Set the refresh token as a secure cookie on the response
        setRefreshTokenCookie(res, refreshToken);

        return sendSuccess(res, 200, {
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        }, 'Login successful.');
    } catch (err) {
        console.error('[AUTH] loginUser error:', err);
        return sendError(res, 500, 'An internal server error occurred.', 'SERVER_ERROR');
    }
};

/**
 * @desc    Register a new user (Admin action only in production)
 * @route   POST /api/v1/auth/register
 * @access  Public (demo) / Admin
 */
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return sendError(res, 400, 'All fields are required.', 'MISSING_FIELDS');
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return sendError(res, 409, 'A user with this email already exists.', 'USER_EXISTS');
        }

        const user = await User.create({ name, email, password, role });

        // Create a role-specific profile placeholder
        if (role === 'student') {
            await Student.create({
                user: user._id,
                rollNumber: 'TEMP' + Date.now(),
                department: 'General',
                semester: 1,
                batchYear: new Date().getFullYear(),
            });
        } else if (role === 'faculty') {
            await Faculty.create({
                user: user._id,
                employeeId: 'EMP' + Date.now(),
                department: 'General',
                designation: 'Lecturer',
            });
        }

        return sendSuccess(res, 201, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        }, 'User registered successfully.');
    } catch (err) {
        console.error('[AUTH] registerUser error:', err);
        return sendError(res, 500, 'An internal server error occurred.', 'SERVER_ERROR');
    }
};

/**
 * @desc    Refresh the access token using the HTTP-only refresh cookie
 * @route   POST /api/v1/auth/refresh
 * @access  Public (requires valid refresh cookie)
 */
const refreshToken = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies?.academix_refresh;

        if (!incomingRefreshToken) {
            return sendError(res, 401, 'No refresh token provided.', 'NO_REFRESH_TOKEN');
        }

        // Decode the token to get the userId (we don't verify signature here, this is a DB-hash check)
        // The refresh token is opaque — we must find the user by checking all hashed tokens.
        // A more scalable approach uses a userId embedded in the cookie alongside the token.
        // For now, we embed the userId in the cookie value as: "<userId>:<token>"
        const [userId, plainToken] = incomingRefreshToken.split(':');

        if (!userId || !plainToken) {
            return sendError(res, 401, 'Malformed refresh token.', 'INVALID_TOKEN');
        }

        const user = await validateRefreshToken(userId, plainToken);
        if (!user) {
            return sendError(res, 401, 'Refresh token is invalid or has expired.', 'REFRESH_FAILED');
        }

        // Rotate: generate new tokens
        const newAccessToken = generateAccessToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken();
        await saveRefreshToken(user._id, newRefreshToken);

        setRefreshTokenCookie(res, `${user._id}:${newRefreshToken}`);

        return sendSuccess(res, 200, { accessToken: newAccessToken }, 'Token refreshed.');
    } catch (err) {
        console.error('[AUTH] refreshToken error:', err);
        return sendError(res, 500, 'An internal server error occurred.', 'SERVER_ERROR');
    }
};

/**
 * @desc    Logout user — clear refresh cookie and revoke DB token
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (userId) {
            await revokeRefreshToken(userId);
        }

        res.clearCookie('academix_refresh', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        return sendSuccess(res, 200, null, 'Logged out successfully.');
    } catch (err) {
        console.error('[AUTH] logoutUser error:', err);
        return sendError(res, 500, 'An internal server error occurred.', 'SERVER_ERROR');
    }
};

/**
 * @desc    Get current logged-in user info
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return sendError(res, 404, 'User not found.', 'USER_NOT_FOUND');
        }
        return sendSuccess(res, 200, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin,
        });
    } catch (err) {
        console.error('[AUTH] getMe error:', err);
        return sendError(res, 500, 'An internal server error occurred.', 'SERVER_ERROR');
    }
};

module.exports = { loginUser, registerUser, refreshToken, logoutUser, getMe };
