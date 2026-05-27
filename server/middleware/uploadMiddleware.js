/**
 * uploadMiddleware.js
 * Multer configuration for local file uploads.
 * Supports: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, CSV, TXT, ZIP,
 *           JPG, PNG, JPEG, GIF, MP4, WEBM, MOV
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Storage Config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/materials');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${timestamp}_${safeOriginal}`);
    },
});

// ── File Type Whitelist ────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Presentations
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Spreadsheets
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    // Text
    'text/plain',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
]);

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not supported: ${file.mimetype}. Allowed: PDF, Word, PowerPoint, Excel, CSV, TXT, ZIP, Images, Videos.`), false);
    }
};

// ── Export Middleware ──────────────────────────────────────────────────────────
const uploadSingle = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB per file
        files: 1,
    },
}).single('file');

const uploadMultiple = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 10,
    },
}).array('files', 10);

/**
 * Wraps multer in a Promise so errors are forwarded to Express error handler.
 */
const handleUploadSingle = (req, res, next) => {
    uploadSingle(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds 100 MB limit.' } });
            }
            return res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: err.message } });
        }
        if (err) {
            return res.status(400).json({ success: false, error: { code: 'FILE_TYPE_ERROR', message: err.message } });
        }
        next();
    });
};

const handleUploadMultiple = (req, res, next) => {
    uploadMultiple(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: err.message } });
        }
        if (err) {
            return res.status(400).json({ success: false, error: { code: 'FILE_TYPE_ERROR', message: err.message } });
        }
        next();
    });
};

module.exports = { handleUploadSingle, handleUploadMultiple };
