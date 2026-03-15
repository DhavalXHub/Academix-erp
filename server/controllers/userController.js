const userService = require('../services/userService');

// ── Helpers ───────────────────────────────────────────────────────────────────
const sendSuccess = (res, status, data, message = 'Success', meta = undefined) =>
    res.status(status).json({ success: true, message, data, meta: meta ?? undefined, error: null });

const sendError = (res, status, message, code = 'ERROR') =>
    res.status(status).json({ success: false, data: null, error: { code, message } });

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * @desc   Get all users with search, filter, pagination
 * @route  GET /api/v1/users
 * @access Admin, Faculty
 */
const getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        const result = await userService.getAllUsers({ role, search, page, limit });
        return sendSuccess(res, 200, { users: result.users }, 'Users fetched.', result.meta);
    } catch (err) {
        console.error('[USER] getAllUsers:', err);
        return sendError(res, 500, 'Failed to fetch users.', 'SERVER_ERROR');
    }
};

/**
 * @desc   Get single user with their profile
 * @route  GET /api/v1/users/:id
 * @access Admin
 */
const getUserById = async (req, res) => {
    try {
        const result = await userService.getUserById(req.params.id);
        if (!result) return sendError(res, 404, 'User not found.', 'NOT_FOUND');
        return sendSuccess(res, 200, result);
    } catch (err) {
        console.error('[USER] getUserById:', err);
        return sendError(res, 500, 'Failed to fetch user.', 'SERVER_ERROR');
    }
};

/**
 * @desc   Create a new user (and role profile)
 * @route  POST /api/v1/users
 * @access Admin
 */
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, ...profileData } = req.body;
        if (!name || !email || !password || !role) {
            return sendError(res, 400, 'name, email, password, and role are required.', 'MISSING_FIELDS');
        }
        const user = await userService.createUser({ name, email, password, role, profileData });
        return sendSuccess(res, 201, user, 'User created successfully.');
    } catch (err) {
        console.error('[USER] createUser:', err);
        return sendError(res, err.status || 500, err.message, err.code || 'SERVER_ERROR');
    }
};

/**
 * @desc   Update user fields (name, email, role, isActive)
 * @route  PUT /api/v1/users/:id
 * @access Admin
 */
const updateUser = async (req, res) => {
    try {
        const updated = await userService.updateUser(req.params.id, req.body);
        return sendSuccess(res, 200, updated, 'User updated successfully.');
    } catch (err) {
        console.error('[USER] updateUser:', err);
        return sendError(res, err.status || 500, err.message, err.code || 'SERVER_ERROR');
    }
};

/**
 * @desc   Hard delete a user and their profile
 * @route  DELETE /api/v1/users/:id
 * @access Admin
 */
const deleteUser = async (req, res) => {
    try {
        await userService.deleteUser(req.params.id, req.user.id);
        return sendSuccess(res, 200, null, 'User deleted successfully.');
    } catch (err) {
        console.error('[USER] deleteUser:', err);
        return sendError(res, err.status || 500, err.message, err.code || 'SERVER_ERROR');
    }
};

/**
 * @desc   Soft-deactivate a user (isActive: false)
 * @route  PUT /api/v1/users/:id/deactivate
 * @access Admin
 */
const deactivateUser = async (req, res) => {
    try {
        const updated = await userService.deactivateUser(req.params.id, req.user.id);
        return sendSuccess(res, 200, updated, 'User deactivated.');
    } catch (err) {
        console.error('[USER] deactivateUser:', err);
        return sendError(res, err.status || 500, err.message, err.code || 'SERVER_ERROR');
    }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, deactivateUser };
