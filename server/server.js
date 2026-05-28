process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    try { require('fs').writeFileSync(__dirname + '/fatal.log', String(err.stack || err)); } catch (_) {}
    process.exit(1);
});
process.on('unhandledRejection', (err) => {
    console.error('[FATAL] Unhandled Rejection:', err);
    try { require('fs').writeFileSync(__dirname + '/fatal.log', String(err?.stack || err)); } catch (_) {}
    process.exit(1);
});

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');
const { validateEnv } = require('./config/env');
const {
    requestContext,
    csrfProtection,
    securityHeaders,
    createRateLimiter,
    auditLogger,
    notFound,
    errorHandler,
} = require('./middleware/opsMiddleware');

// Load env vars
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });
validateEnv();

// Connect to Database
connectDB();

const app = express();
app.set('trust proxy', 1);
const clientDistPath = path.resolve(__dirname, '../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');

const normalizeOrigin = (value) => {
    if (!value) return '';
    return String(value).trim().replace(/\/$/, '');
};

// ── Core Middleware ────────────────────────────────────────────────────────
app.use(requestContext);
app.use(securityHeaders);
app.use('/assets', express.static(path.join(clientDistPath, 'assets'), {
    immutable: true,
    maxAge: '1y',
    fallthrough: true,
}));
app.use(createRateLimiter({ windowMs: 60 * 1000, max: Number(process.env.RATE_LIMIT_PER_MINUTE || 240) }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Cookie parser — required to read the HTTP-Only refresh token cookie
app.use(cookieParser());
app.use(csrfProtection);
app.use(auditLogger);

const allowedOrigins = [
    normalizeOrigin("http://localhost:5173"),
    normalizeOrigin(process.env.CLIENT_ORIGIN),
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin
            if (!origin) return callback(null, true);

            const normalizedOrigin = normalizeOrigin(origin);

            if (allowedOrigins.includes(normalizedOrigin)) {
                return callback(null, true);
            }

            console.error("Blocked by CORS:", origin);

            return callback(
                new Error(`Origin not allowed by CORS: ${origin}`)
            );
        },
        credentials: true,
    })
);

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            status: 'ok',
            service: 'academix-api',
            uptimeSeconds: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
        },
        error: null,
        requestId: req.requestId,
    });
});

// ── Uploaded Files — served publicly with authentication awareness ─────────
// Protected so only authenticated users can view the files (using query ?token=...)
const { protect } = require('./middleware/authMiddleware');
app.use('/uploads', protect, express.static(path.join(__dirname, '../uploads')));
// If a file in /uploads is not found by static middleware, return 404 instead of falling through to SPA fallback
app.use('/uploads', (req, res) => {
    res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'The requested file was not found on the server.' } });
});

// ── API Routes (v1) ────────────────────────────────────────────────────────
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/profile', require('./routes/profileRoutes'));
app.use('/api/v1/admissions', require('./routes/admissionRoutes'));
app.use('/api/v1/courses', require('./routes/courseRoutes'));
app.use('/api/v1/foundation', require('./routes/foundationRoutes'));
app.use('/api/v1/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/v1/timetable', require('./routes/timetableRoutes'));
app.use('/api/v1/attendance', require('./routes/attendanceRoutes'));
app.use('/api/v1/qr-attendance', require('./routes/qrAttendanceRoutes'));
app.use('/api/v1/materials', require('./routes/materialRoutes'));
app.use('/api/v1/assignments', require('./routes/assignmentRoutes'));
app.use('/api/v1/submissions', require('./routes/submissionRoutes'));

app.use('/api/v1/billing', require('./routes/billingRoutes'));
app.use('/api/v1/invoices', require('./routes/invoiceRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/analytics', require('./routes/analyticsRoutes'));
app.use('/api/v1/marks', require('./routes/marksRoutes'));
app.use('/api/v1/quizzes', require('./routes/quizRoutes'));
app.use('/api/v1/attempts', require('./routes/attemptRoutes'));
app.use('/api/v1/results', require('./routes/resultRoutes'));
app.use('/api/v1/messages', require('./routes/messageRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/faculty', require('./routes/facultyRoutes'));
app.use('/api/v1/announcements', require('./routes/announcementsRoutes'));
app.use('/api/v1/course-announcements', require('./routes/courseAnnouncementRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/exams', require('./routes/examRoutes'));
app.use('/api/v1/audit-logs', require('./routes/auditRoutes'));
app.use('/api/v1/faculty-addons', require('./routes/facultyAddons'));
app.use('/api/v1/academic-calendars', require('./routes/academicCalendarRoutes'));

// ── Legacy /api/* alias (backward-compatible for old HTML frontend) ─────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/admissions', require('./routes/admissionRoutes'));
app.use('/api/foundation', require('./routes/foundationRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/qr-attendance', require('./routes/qrAttendanceRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/marks', require('./routes/marksRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/announcements', require('./routes/announcementsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));

// ── Global Error Handler ───────────────────────────────────────────────────
app.use('/api', notFound);

// ── Socket Server ──────────────────────────────────────────────────────────
const http = require('http');
const { initSocket } = require('./socketServer');
const server = http.createServer(app);
initSocket(server);

// ── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Academix API & Socket Server running at http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

    // Start assignment deadline reminder scheduler (checks every 5 minutes)
    setInterval(async () => {
        try {
            const { sendDeadlineReminders } = require('./services/notificationService');
            // Check for 1-day (24 hours) deadlines
            await sendDeadlineReminders(24);
            // Check for 1-hour deadlines
            await sendDeadlineReminders(1);
        } catch (err) {
            console.error('[DeadlineReminder Scheduler] Error:', err.message);
        }
    }, 5 * 60 * 1000);
});

/* Serve frontend static files */
app.use(express.static(clientDistPath));

/* React SPA fallback */
app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'API route not found',
        });
    }

    res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.use(errorHandler);
