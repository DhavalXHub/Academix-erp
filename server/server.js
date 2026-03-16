process.on('uncaughtException', err => require('fs').writeFileSync(__dirname + '/fatal.log', err.stack));
process.on('unhandledRejection', err => require('fs').writeFileSync(__dirname + '/fatal.log', err.stack));
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// ── Core Middleware ────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie parser — required to read the HTTP-Only refresh token cookie
app.use(cookieParser());

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', // Vite default port
    credentials: true, // Required to allow cookies to be sent cross-origin
}));

// ── Static Files (Legacy HTML frontend) ───────────────────────────────────
app.use(express.static(path.join(__dirname, '../client')));

// ── API Routes (v1) ────────────────────────────────────────────────────────
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/profile', require('./routes/profileRoutes'));
app.use('/api/v1/courses', require('./routes/courseRoutes'));
app.use('/api/v1/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/v1/attendance', require('./routes/attendanceRoutes'));
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
app.use('/api/v1/messages', require('./routes/messageRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/faculty', require('./routes/facultyRoutes'));
app.use('/api/v1/announcements', require('./routes/announcementsRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));

// ── Legacy /api/* alias (backward-compatible for old HTML frontend) ─────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/marks', require('./routes/marksRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/announcements', require('./routes/announcementsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        data: null,
        error: {
            code: err.code || 'SERVER_ERROR',
            message: err.message || 'An unexpected error occurred.',
        },
    });
});

// ── SPA Fallback (serves HTML frontend for all unmatched non-API routes) ──
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'index.html'));
});

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
});
