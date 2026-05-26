const PDFDocument = require('pdfkit');
const ExamResult = require('../models/ExamResult');
const ExamEvent = require('../models/ExamEvent');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const User = require('../models/User');

const ok = (res, status, data, message = 'Success') => {
    res.status(status).json({ success: true, message, data, error: null, requestId: res.getHeader('X-Request-Id') });
};

const fail = (res, status, code, message) => {
    res.status(status).json({ success: false, data: null, error: { code, message }, requestId: res.getHeader('X-Request-Id') });
};

const ensureCourseAccess = async (user, courseId) => {
    if (user.role === 'admin') return true;
    if (user.role !== 'faculty') return false;
    const faculty = await Faculty.findOne({ user: user.id }).select('_id');
    if (!faculty) return false;
    return Boolean(await Course.exists({ _id: courseId, primaryFaculty: faculty._id }));
};

const buildResultQuery = ({ courseId, academicYear, semester, assessmentType, status }) => {
    const query = {};
    if (courseId) query.course = courseId;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = Number(semester);
    if (assessmentType && assessmentType !== 'all') query.assessmentType = assessmentType;
    if (status && status !== 'all') query.status = status;
    return query;
};

const computeSummary = (results) => {
    const totalScore = results.reduce((sum, item) => sum + item.score, 0);
    const totalMax = results.reduce((sum, item) => sum + item.maxScore, 0);
    const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 10000) / 100 : 0;
    return {
        totalScore,
        totalMax,
        percentage,
        result: percentage >= 40 ? 'PASS' : 'FAIL',
    };
};

const gradePointFor = (percentage) => {
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 50) return 6;
    if (percentage >= 40) return 5;
    return 0;
};

const computeAcademicSummary = (results) => {
    const courseMap = new Map();
    results.forEach((item) => {
        const courseId = String(item.course?._id || item.course);
        const current = courseMap.get(courseId) || {
            course: item.course,
            semester: item.semester,
            score: 0,
            maxScore: 0,
            credits: Number(item.course?.credits || 3),
        };
        current.score += item.score;
        current.maxScore += item.maxScore;
        courseMap.set(courseId, current);
    });

    const courses = Array.from(courseMap.values()).map((item) => {
        const percentage = item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0;
        const gradePoint = gradePointFor(percentage);
        return {
            ...item,
            percentage: Math.round(percentage * 100) / 100,
            gradePoint,
            creditPoints: gradePoint * item.credits,
        };
    });

    const totalCredits = courses.reduce((sum, item) => sum + item.credits, 0);
    const totalCreditPoints = courses.reduce((sum, item) => sum + item.creditPoints, 0);
    return {
        courses,
        totalCredits,
        gpa: totalCredits > 0 ? Math.round((totalCreditPoints / totalCredits) * 100) / 100 : 0,
    };
};

const upsertResult = async (req, res, next) => {
    try {
        const {
            studentId,
            courseId,
            academicYear,
            semester,
            assessmentType = 'internal',
            assessmentTitle,
            score,
            maxScore,
            grade = '',
            remarks = '',
            status = 'draft',
        } = req.body;

        if (!studentId || !courseId || !academicYear || !semester || !assessmentTitle || score === undefined || !maxScore) {
            return fail(res, 400, 'MISSING_FIELDS', 'studentId, courseId, academicYear, semester, assessmentTitle, score, and maxScore are required.');
        }

        if (!(await ensureCourseAccess(req.user, courseId))) {
            return fail(res, 403, 'FORBIDDEN', 'Not authorized to manage results for this course.');
        }

        const enrolled = await Enrollment.exists({
            student: studentId,
            course: courseId,
            academicYear,
            status: { $in: ['enrolled', 'completed'] },
        });
        if (!enrolled) return fail(res, 400, 'NOT_ENROLLED', 'Student is not enrolled in this course for the academic year.');

        const numericScore = Number(score);
        const numericMax = Number(maxScore);
        if (Number.isNaN(numericScore) || Number.isNaN(numericMax) || numericScore < 0 || numericMax <= 0 || numericScore > numericMax) {
            return fail(res, 400, 'INVALID_SCORE', 'Score must be between 0 and maxScore.');
        }

        const result = await ExamResult.findOneAndUpdate(
            { student: studentId, course: courseId, academicYear, semester, assessmentType, assessmentTitle },
            {
                student: studentId,
                course: courseId,
                academicYear,
                semester,
                assessmentType,
                assessmentTitle,
                score: numericScore,
                maxScore: numericMax,
                grade,
                remarks,
                status,
                moderationStatus: status === 'published' ? 'approved' : 'pending',
                enteredBy: req.user.id,
                publishedAt: status === 'published' ? new Date() : null,
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        )
            .populate('student', 'name email')
            .populate('course', 'code title semester department')
            .populate('enteredBy', 'name email role');

        ok(res, 200, { result }, 'Result saved.');
    } catch (err) {
        next(err);
    }
};

const getCourseResults = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        if (!(await ensureCourseAccess(req.user, courseId))) {
            return fail(res, 403, 'FORBIDDEN', 'Not authorized to view results for this course.');
        }

        const results = await ExamResult.find(buildResultQuery({ courseId, ...req.query }))
            .populate('student', 'name email')
            .populate('course', 'code title semester department')
            .sort({ assessmentTitle: 1, 'student.name': 1 });

        ok(res, 200, { results });
    } catch (err) {
        next(err);
    }
};

const publishCourseResults = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        if (!(await ensureCourseAccess(req.user, courseId))) {
            return fail(res, 403, 'FORBIDDEN', 'Not authorized to publish results for this course.');
        }

        const query = { ...buildResultQuery({ courseId, ...req.body }), moderationStatus: 'approved' };
        const update = await ExamResult.updateMany(query, { status: 'published', publishedAt: new Date() });
        ok(res, 200, { matched: update.matchedCount, modified: update.modifiedCount }, 'Results published.');
    } catch (err) {
        next(err);
    }
};

const approveCourseResults = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        if (!(await ensureCourseAccess(req.user, courseId))) {
            return fail(res, 403, 'FORBIDDEN', 'Not authorized to approve results for this course.');
        }

        const query = buildResultQuery({ courseId, ...req.body });
        const update = await ExamResult.updateMany(query, {
            moderationStatus: 'approved',
            moderatedBy: req.user.id,
            moderatedAt: new Date(),
        });
        ok(res, 200, { matched: update.matchedCount, modified: update.modifiedCount }, 'Results approved.');
    } catch (err) {
        next(err);
    }
};

const getMyResults = async (req, res, next) => {
    try {
        const results = await ExamResult.find({
            student: req.user.id,
            status: 'published',
            ...buildResultQuery(req.query),
        })
            .populate('course', 'code title semester department credits')
            .sort({ semester: 1, assessmentTitle: 1 });

        ok(res, 200, { results, summary: computeSummary(results), academic: computeAcademicSummary(results) });
    } catch (err) {
        next(err);
    }
};

const downloadMyTranscript = async (req, res, next) => {
    try {
        const academicYear = req.query.academicYear || '2025-2026';
        const student = await Student.findOne({ user: req.user.id }).populate('user', 'name email');
        if (!student) return fail(res, 404, 'STUDENT_NOT_FOUND', 'Student profile not found.');

        const results = await ExamResult.find({
            student: req.user.id,
            academicYear,
            status: 'published',
        }).populate('course', 'code title credits');

        const semesters = new Map();
        results.forEach((item) => {
            const list = semesters.get(item.semester) || [];
            list.push(item);
            semesters.set(item.semester, list);
        });

        const doc = new PDFDocument({ margin: 48 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=academix-transcript-${academicYear}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('Academix College', { align: 'center' });
        doc.fontSize(15).text('Academic Transcript', { align: 'center' });
        doc.moveDown();
        doc.fontSize(11).text(`Student: ${student.user.name}`);
        doc.text(`Roll Number: ${student.rollNumber}`);
        doc.text(`Department: ${student.department}`);
        doc.text(`Academic Year: ${academicYear}`);
        doc.moveDown();

        let totalCredits = 0;
        let totalCreditPoints = 0;
        Array.from(semesters.keys()).sort((a, b) => a - b).forEach((semester) => {
            const academic = computeAcademicSummary(semesters.get(semester));
            totalCredits += academic.totalCredits;
            totalCreditPoints += academic.courses.reduce((sum, item) => sum + item.creditPoints, 0);
            doc.fontSize(13).text(`Semester ${semester} - GPA ${academic.gpa}`, { underline: true });
            academic.courses.forEach((item) => {
                doc.fontSize(10).text(`${item.course.code} - ${item.course.title}: ${item.percentage}% | GP ${item.gradePoint} | Credits ${item.credits}`);
            });
            doc.moveDown(0.75);
        });
        const cgpa = totalCredits > 0 ? Math.round((totalCreditPoints / totalCredits) * 100) / 100 : 0;
        doc.fontSize(14).text(`CGPA: ${cgpa}`, { align: 'right' });
        doc.end();
    } catch (err) {
        next(err);
    }
};

const getMyHallTicket = async (req, res, next) => {
    try {
        const studentProfile = await Student.findOne({ user: req.user.id }).populate('user', 'name email');
        if (!studentProfile) return fail(res, 404, 'STUDENT_NOT_FOUND', 'Student profile not found.');

        const enrollments = await Enrollment.find({
            student: req.user.id,
            status: { $in: ['enrolled', 'completed'] },
        }).select('course academicYear semester');
        const courseIds = enrollments.map(item => item.course);

        const events = await ExamEvent.find({
            status: 'published',
            targetAudience: { $in: ['all', 'student'] },
            startsAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            $or: [{ course: { $in: courseIds } }, { course: null }],
        })
            .populate('course', 'code title semester department')
            .sort({ startsAt: 1 });

        ok(res, 200, {
            student: studentProfile,
            events,
            generatedAt: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
};

const downloadMyMarksheet = async (req, res, next) => {
    try {
        const semester = Number(req.params.semester);
        const academicYear = req.query.academicYear || '2025-2026';
        const student = await Student.findOne({ user: req.user.id }).populate('user', 'name email');
        if (!student) return fail(res, 404, 'STUDENT_NOT_FOUND', 'Student profile not found.');

        const results = await ExamResult.find({
            student: req.user.id,
            academicYear,
            semester,
            status: 'published',
        }).populate('course', 'code title credits');

        const summary = computeSummary(results);
        const doc = new PDFDocument({ margin: 48 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=academix-marksheet-sem${semester}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('Academix College', { align: 'center' });
        doc.moveDown(0.25);
        doc.fontSize(15).text('Official Marksheet', { align: 'center' });
        doc.moveDown();
        doc.fontSize(11).text(`Student: ${student.user.name}`);
        doc.text(`Roll Number: ${student.rollNumber}`);
        doc.text(`Department: ${student.department}`);
        doc.text(`Academic Year: ${academicYear}`);
        doc.text(`Semester: ${semester}`);
        doc.moveDown();

        doc.fontSize(11).text('Course', 48, doc.y, { continued: true, width: 220 });
        doc.text('Assessment', 240, doc.y, { continued: true, width: 150 });
        doc.text('Score', 390, doc.y, { continued: true, width: 70 });
        doc.text('Grade', 460, doc.y, { width: 60 });
        doc.moveDown(0.5);
        doc.moveTo(48, doc.y).lineTo(540, doc.y).stroke();
        doc.moveDown(0.5);

        results.forEach(item => {
            doc.text(`${item.course.code} - ${item.course.title}`, 48, doc.y, { continued: true, width: 190 });
            doc.text(item.assessmentTitle, 240, doc.y, { continued: true, width: 140 });
            doc.text(`${item.score}/${item.maxScore}`, 390, doc.y, { continued: true, width: 70 });
            doc.text(item.grade || '-', 460, doc.y, { width: 60 });
        });

        doc.moveDown();
        doc.moveTo(48, doc.y).lineTo(540, doc.y).stroke();
        doc.moveDown();
        doc.fontSize(13).text(`Total: ${summary.totalScore}/${summary.totalMax} (${summary.percentage}%)`, { align: 'right' });
        doc.text(`Result: ${summary.result}`, { align: 'right' });
        doc.end();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    upsertResult,
    getCourseResults,
    approveCourseResults,
    publishCourseResults,
    getMyResults,
    getMyHallTicket,
    downloadMyMarksheet,
    downloadMyTranscript,
    _test: {
        computeSummary,
        computeAcademicSummary,
        gradePointFor,
    },
};
