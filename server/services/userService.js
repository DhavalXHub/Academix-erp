const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetch the role-specific profile document populated with user info.
 * Returns null if no profile exists.
 */
const _getProfileByUserId = async (userId, role) => {
    if (role === 'student') {
        return Student.findOne({ user: userId }).populate('user', '-password -refreshTokenHash');
    }
    if (role === 'faculty') {
        return Faculty.findOne({ user: userId }).populate('user', '-password -refreshTokenHash');
    }
    return null;
};

// ── User CRUD ────────────────────────────────────────────────────────────────

/**
 * Get a paginated, filtered list of all users.
 * Supports query params: role, search (name/email), page, limit
 */
const getAllUsers = async ({ role, search, page = 1, limit = 20 }) => {
    const query = {};
    if (role) query.role = role;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        User.find(query)
            .select('-password -refreshTokenHash')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        User.countDocuments(query),
    ]);

    return {
        users,
        meta: {
            page: Number(page),
            limit: Number(limit),
            totalRecords: total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get a single user by ID including their role-specific profile.
 */
const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password -refreshTokenHash');
    if (!user) return null;

    const profile = await _getProfileByUserId(userId, user.role);
    return { user, profile };
};

/**
 * Create a new user and an associated role-specific profile.
 * Admin only action.
 */
const createUser = async ({ name, email, password, role, profileData = {} }) => {
    const existing = await User.findOne({ email });
    if (existing) throw Object.assign(new Error('A user with this email already exists.'), { code: 'USER_EXISTS', status: 409 });

    const user = await User.create({ name, email, password, role });

    if (role === 'student') {
        await Student.create({
            user: user._id,
            rollNumber: profileData.rollNumber || 'STU' + Date.now(),
            department: profileData.department || 'General',
            semester: profileData.semester || 1,
            batchYear: profileData.batchYear || new Date().getFullYear(),
        });
    } else if (role === 'faculty') {
        await Faculty.create({
            user: user._id,
            employeeId: profileData.employeeId || 'EMP' + Date.now(),
            department: profileData.department || 'General',
            designation: profileData.designation || 'Lecturer',
        });
    }

    return { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
};

/**
 * Update a user's core fields (name, email, role, isActive).
 * Admin only action.
 */
const updateUser = async (userId, updates) => {
    // Disallow password updates through this route — use dedicated change-password endpoint
    const ALLOWED_FIELDS = ['name', 'email', 'role', 'isActive'];
    const safeUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => ALLOWED_FIELDS.includes(key))
    );

    const user = await User.findByIdAndUpdate(userId, safeUpdates, { new: true, runValidators: true })
        .select('-password -refreshTokenHash');

    if (!user) throw Object.assign(new Error('User not found.'), { code: 'USER_NOT_FOUND', status: 404 });
    return user;
};

/**
 * Soft-deactivate a user (sets isActive: false). Cannot deactivate own account.
 * For hard delete see deleteUser.
 */
const deactivateUser = async (userId, requestingUserId) => {
    if (String(userId) === String(requestingUserId)) {
        throw Object.assign(new Error('You cannot deactivate your own account.'), { code: 'SELF_ACTION', status: 400 });
    }
    return updateUser(userId, { isActive: false });
};

/**
 * Hard delete a user and their associated profile.
 */
const deleteUser = async (userId, requestingUserId) => {
    if (String(userId) === String(requestingUserId)) {
        throw Object.assign(new Error('You cannot delete your own account.'), { code: 'SELF_ACTION', status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) throw Object.assign(new Error('User not found.'), { code: 'USER_NOT_FOUND', status: 404 });

    // Delete role-specific profile document
    if (user.role === 'student') await Student.deleteOne({ user: userId });
    else if (user.role === 'faculty') await Faculty.deleteOne({ user: userId });

    await User.findByIdAndDelete(userId);
    return { deleted: true };
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deactivateUser,
    deleteUser,
};
