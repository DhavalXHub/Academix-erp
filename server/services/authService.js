const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ── Token Generators ─────────────────────────────────────────────────────────

/**
 * Generates a short-lived JWT access token (15 minutes).
 * Payload contains user ID and role for fast RBAC middleware checks.
 */
const generateAccessToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );
};

/**
 * Generates a cryptographically random opaque refresh token (7 days).
 * The token itself is a random string; only its SHA-256 hash is stored in DB.
 */
const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

// ── Core Auth Service Functions ──────────────────────────────────────────────

/**
 * Verify user credentials by email + password + role.
 * Returns the full user object on success, null on failure.
 */
const verifyUserCredentials = async (email, password, role) => {
    // Explicitly select 'password' since it is select:false by default
    const user = await User.findOne({ email, isActive: true }).select('+password');

    if (!user) return null;

    // Validate role matches
    if (user.role !== role) return null;

    // Compare entered password against bcrypt hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return null;

    return user;
};

/**
 * Stores a hashed version of the refresh token inside the User document.
 * Using a hash means a stolen DB dump cannot be used to forge sessions.
 */
const saveRefreshToken = async (userId, plainToken) => {
    const hash = await bcrypt.hash(plainToken, 8);
    await User.findByIdAndUpdate(userId, { refreshTokenHash: hash, lastLogin: new Date() });
};

/**
 * Validates an incoming plain refresh token against the stored hash.
 * Returns the user document if valid, null otherwise.
 */
const validateRefreshToken = async (userId, plainToken) => {
    const user = await User.findById(userId).select('+refreshTokenHash');
    if (!user || !user.refreshTokenHash) return null;

    const isValid = await bcrypt.compare(plainToken, user.refreshTokenHash);
    return isValid ? user : null;
};

/**
 * Clears the refresh token hash from the DB (logout / token rotation).
 */
const revokeRefreshToken = async (userId) => {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyUserCredentials,
    saveRefreshToken,
    validateRefreshToken,
    revokeRefreshToken,
};
