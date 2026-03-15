const profileService = require('../services/profileService');

const sendSuccess = (res, status, data, message = 'Success') =>
    res.status(status).json({ success: true, message, data, error: null });

const sendError = (res, status, message, code = 'ERROR') =>
    res.status(status).json({ success: false, data: null, error: { code, message } });

/**
 * @desc   Get current user's profile (user + role-specific document)
 * @route  GET /api/v1/profile/me
 * @access Private (any authenticated role)
 */
const getMyProfile = async (req, res) => {
    try {
        const result = await profileService.getMyProfile(req.user.id, req.user.role);
        return sendSuccess(res, 200, result);
    } catch (err) {
        console.error('[PROFILE] getMyProfile:', err);
        return sendError(res, err.status || 500, err.message, err.code || 'SERVER_ERROR');
    }
};

/**
 * @desc   Update current user's profile (name + role-specific fields)
 * @route  PUT /api/v1/profile/me
 * @access Private (any authenticated role)
 */
const updateMyProfile = async (req, res) => {
    try {
        const result = await profileService.updateMyProfile(req.user.id, req.user.role, req.body);
        return sendSuccess(res, 200, result, 'Profile updated successfully.');
    } catch (err) {
        console.error('[PROFILE] updateMyProfile:', err);
        return sendError(res, err.status || 500, err.message, err.code || 'SERVER_ERROR');
    }
};

module.exports = { getMyProfile, updateMyProfile };
