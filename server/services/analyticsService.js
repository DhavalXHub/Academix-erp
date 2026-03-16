const mongoose = require('mongoose');
const AttendanceRecord = require('../models/AttendanceRecord');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });
const _notFound = (msg) => Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });

const getStudentAnalytics = async (userId) => {
    const student = await Student.findOne({ user: userId });
    if (!student) throw _notFound('Student not found.');

    const studentId = student._id;

    // 1. Attendance Average
    const attendanceStats = await AttendanceRecord.aggregate([
        { $unwind: "$records" },
        { $match: { "records.student": studentId } },
        { 
            $group: { 
                _id: null, 
                totalClasses: { $sum: 1 }, 
                present: { $sum: { $cond: [{ $in: ["$records.status", ["present", "late", "excused"]] }, 1, 0] } } 
            }
        }
    ]);
    const attendancePercentage = attendanceStats.length > 0 ? (attendanceStats[0].present / attendanceStats[0].totalClasses) * 100 : 100;

    // 2. Assignment Average
    const submissions = await Submission.find({ student: studentId }).populate('assignment', 'maxMarks');
    let totalMarksEarned = 0;
    let totalMaxMarks = 0;
    submissions.forEach(sub => {
        if (sub.marksAwarded !== undefined && sub.assignment) {
            totalMarksEarned += sub.marksAwarded;
            totalMaxMarks += sub.assignment.maxMarks;
        }
    });
    const assignmentAverage = totalMaxMarks > 0 ? (totalMarksEarned / totalMaxMarks) * 100 : 100;

    // 3. Quiz Average
    const quizAttempts = await QuizAttempt.aggregate([
        { $match: { student: studentId } },
        {
            $lookup: {
                from: 'quizzes',
                localField: 'quiz',
                foreignField: '_id',
                as: 'quizDetails'
            }
        },
        { $unwind: "$quizDetails" }
    ]);

    let quizEarned = 0;
    let quizMax = 0;
    quizAttempts.forEach(attempt => {
        const totalQuizMarks = attempt.quizDetails.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
        quizEarned += attempt.score;
        quizMax += totalQuizMarks;
    });
    const quizAverage = quizMax > 0 ? (quizEarned / quizMax) * 100 : 100;

    // 4. Overall Score (Weighted roughly)
    const overallScore = (attendancePercentage * 0.2) + (assignmentAverage * 0.4) + (quizAverage * 0.4);

    return {
        attendancePercentage: Math.round(attendancePercentage),
        assignmentAverage: Math.round(assignmentAverage),
        quizAverage: Math.round(quizAverage),
        overallScore: Math.round(overallScore)
    };
};

const getFacultyAnalytics = async (userId, courseId) => {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty) throw _notFound('Faculty not found.');

    const course = await Course.findById(courseId);
    if (!course || course.primaryFaculty.toString() !== faculty._id.toString()) {
        throw _bad('Not authorized to view analytics for this course.');
    }

    const cId = new mongoose.Types.ObjectId(courseId);

    // 1. Class Attendance Trends (last 10 sessions)
    const attendanceTrends = await AttendanceRecord.aggregate([
        { $match: { course: cId } },
        { $sort: { date: 1 } },
        { $limit: 10 },
        {
            $project: {
                date: 1,
                presentCount: {
                    $size: {
                        $filter: {
                            input: "$records",
                            as: "record",
                            cond: { $in: ["$$record.status", ["present", "late", "excused"]] }
                        }
                    }
                },
                totalStudents: { $size: "$records" }
            }
        }
    ]);

    // 2. Assignment Completion Rates
    const assignments = await Assignment.find({ course: cId });
    const assignmentStats = await Promise.all(assignments.map(async (assign) => {
        const subCount = await Submission.countDocuments({ assignment: assign._id });
        const enrollCount = await Enrollment.countDocuments({ course: cId, status: 'enrolled' });
        return {
            title: assign.title,
            completionRate: enrollCount > 0 ? (subCount / enrollCount) * 100 : 0
        };
    }));

    // 3. Quiz Score Distribution
    const quizzes = await Quiz.find({ course: cId });
    const quizDistributions = await Promise.all(quizzes.map(async (quiz) => {
        const attempts = await QuizAttempt.find({ quiz: quiz._id });
        const maxScore = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
        
        let avgScore = 0;
        if (attempts.length > 0) {
            avgScore = attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length;
        }

        return {
            title: quiz.title,
            averageScorePercentage: maxScore > 0 ? (avgScore / maxScore) * 100 : 0,
            attemptCount: attempts.length
        };
    }));

    return {
        attendanceTrends,
        assignmentStats,
        quizDistributions
    };
};

const getAdminAnalytics = async () => {
    // 1. Top Level Counters
    const [totalStudents, totalFaculty, totalCourses] = await Promise.all([
        Student.countDocuments(),
        Faculty.countDocuments(),
        Course.countDocuments(),
    ]);

    // 2. Revenue Collected vs Pending Dues
    const revenueData = await Payment.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$amount" }
            }
        }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const invoiceData = await Invoice.aggregate([
        { $match: { status: { $ne: 'paid_full' } } },
        {
            $group: {
                _id: null,
                totalPending: { $sum: { $subtract: ["$amountDue", "$amountPaid"] } }
            }
        }
    ]);
    const pendingDues = invoiceData.length > 0 ? invoiceData[0].totalPending : 0;

    // 3. Department Performance Comparison (Enrollments per department)
    const deptPerformance = await Course.aggregate([
        {
            $lookup: {
                from: "departments",
                localField: "department",
                foreignField: "_id",
                as: "dept"
            }
        },
        { $unwind: "$dept" },
        {
            $lookup: {
                from: "enrollments",
                localField: "_id",
                foreignField: "course",
                as: "enrollments"
            }
        },
        {
            $project: {
                deptName: "$dept.name",
                enrollmentCount: { $size: "$enrollments" }
            }
        },
        {
            $group: {
                _id: "$deptName",
                totalEnrollments: { $sum: "$enrollmentCount" }
            }
        },
        { $sort: { totalEnrollments: -1 } }
    ]);

    // 4. Monthly Revenue Trend mapping (past 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const revenueTrend = await Payment.aggregate([
        { $match: { paymentDate: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { month: { $month: "$paymentDate" }, year: { $year: "$paymentDate" } },
                revenue: { $sum: "$amount" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    return {
        totalStudents,
        totalFaculty,
        totalCourses,
        totalRevenue,
        pendingDues,
        deptPerformance: deptPerformance.map(d => ({ department: d._id, enrollments: d.totalEnrollments })),
        revenueTrend: revenueTrend.map(r => ({ label: `${r._id.month}/${r._id.year}`, revenue: r.revenue }))
    };
};

module.exports = {
    getStudentAnalytics,
    getFacultyAnalytics,
    getAdminAnalytics
};
