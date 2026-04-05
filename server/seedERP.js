/**
 * Enhanced Academix ERP Seeder
 * Populates database with comprehensive demo data for all modules
 */

require('dotenv').config();
const mongoose = require('./config/db');
const User = require('./models/User');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Timetable = require('./models/Timetable');
const Attendance = require('./models/Attendance');
const Marks = require('./models/Marks');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Quiz = require('./models/Quiz');
const QuizAttempt = require('./models/QuizAttempt');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');
const Notice = require('./models/Notice');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting Academix ERP Database Seed...\n');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Student.deleteMany({}),
            Faculty.deleteMany({}),
            Course.deleteMany({}),
            Enrollment.deleteMany({}),
            Timetable.deleteMany({}),
            Attendance.deleteMany({}),
            Marks.deleteMany({}),
            Assignment.deleteMany({}),
            Submission.deleteMany({}),
            Quiz.deleteMany({}),
            QuizAttempt.deleteMany({}),
            Invoice.deleteMany({}),
            Payment.deleteMany({}),
            Notification.deleteMany({}),
            Notice.deleteMany({}),
        ]);
        console.log('✓ Cleared existing data');

        // === 1. CREATE ADMIN USER ===
        const adminUser = await User.create({
            email: 'admin@academix.edu',
            password: 'password123', // Will be hashed by pre-save hook
            name: 'Admin User',
            role: 'admin',
            isEmailVerified: true,
        });
        console.log('✓ Created admin user');

        // === 2. CREATE FACULTY USERS & PROFILES ===
        const facultyData = [
            { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@academix.edu', department: 'Computer Science', specialization: 'Data Science' },
            { name: 'Prof. Priya Singh', email: 'priya.singh@academix.edu', department: 'Mathematics', specialization: 'Algebra' },
            { name: 'Dr. Amit Sharma', email: 'amit.sharma@academix.edu', department: 'Physics', specialization: 'Quantum Mechanics' },
        ];

        const facultyUsers = await User.insertMany(
            facultyData.map(f => ({
                email: f.email,
                password: 'password123',
                name: f.name,
                role: 'faculty',
                isEmailVerified: true,
            }))
        );

        const faculties = await Faculty.insertMany(
            facultyUsers.map((user, idx) => ({
                user: user._id,
                firstName: facultyData[idx].name.split(' ')[0],
                lastName: facultyData[idx].name.split(' ')[1],
                email: facultyData[idx].email,
                department: facultyData[idx].department,
                specialization: facultyData[idx].specialization,
                qualification: 'PhD',
                telephoneNumber: '555-' + (1000 + idx),
                isActive: true,
            }))
        );
        console.log('✓ Created 3 faculty members');

        // === 3. CREATE STUDENT USERS & PROFILES ===
        const departments = ['Computer Science', 'Mathematics', 'Physics'];
        const studentUsers = [];
        const students = [];

        for (let i = 0; i < 30; i++) {
            const dept = departments[i % 3];
            const firstName = `Student${i + 1}`;
            const email = `student${i + 1}@academix.edu`;

            const user = await User.create({
                email,
                password: 'password123',
                name: firstName,
                role: 'student',
                isEmailVerified: true,
            });

            const student = await Student.create({
                user: user._id,
                firstName,
                lastName: `User${i + 1}`,
                email,
                rollNumber: `${dept.substring(0, 3).toUpperCase()}${2025}${String(i + 1).padStart(3, '0')}`,
                department: dept,
                semester: 6,
            });

            studentUsers.push(user);
            students.push(student);
        }
        console.log(`✓ Created 30 students across 3 departments`);

        // === 4. CREATE COURSES ===
        const courseData = [
            { code: 'CS601', title: 'Data Structures & Algorithms', credits: 4, department: 'Computer Science', semester: 6 },
            { code: 'CS602', title: 'Database Systems', credits: 4, department: 'Computer Science', semester: 6 },
            { code: 'MATH601', title: 'Advanced Calculus', credits: 3, department: 'Mathematics', semester: 6 },
            { code: 'MATH602', title: 'Linear Algebra', credits: 3, department: 'Mathematics', semester: 6 },
            { code: 'PHYS601', title: 'Quantum Mechanics', credits: 4, department: 'Physics', semester: 6 },
            { code: 'PHYS602', title: 'Thermodynamics', credits: 3, department: 'Physics', semester: 6 },
        ];

        const courses = await Course.insertMany(
            courseData.map((c, idx) => ({
                code: c.code,
                title: c.title,
                credits: c.credits,
                department: c.department,
                semester: c.semester,
                description: `A comprehensive course on ${c.title}`,
                primaryFaculty: faculties[idx % 3]._id,
                isActive: true,
                academicYear: '2025-2026',
            }))
        );
        console.log('✓ Created 6 courses');

        // === 5. CREATE ENROLLMENTS ===
        const enrollments = [];
        for (let i = 0; i < students.length; i++) {
            const dept = students[i].department;
            const deptCourses = courses.filter(c => c.department === dept);

            for (const course of deptCourses.slice(0, 2)) {
                enrollments.push({
                    student: students[i]._id,
                    course: course._id,
                    academicYear: '2025-2026',
                    semester: 6,
                    status: 'enrolled',
                });
            }
        }
        await Enrollment.insertMany(enrollments);
        console.log(`✓ Created ${enrollments.length} enrollments`);

        // === 6. CREATE TIMETABLE ===
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const timeSlots = [
            { start: '09:00', end: '10:30' },
            { start: '11:00', end: '12:30' },
            { start: '14:00', end: '15:30' },
        ];

        const timetableEntries = [];
        for (let i = 0; i < courses.length; i++) {
            const course = courses[i];
            const faculty = faculties[i % 3];
            const day = daysOfWeek[i % 5];
            const slot = timeSlots[Math.floor(i / 5) % 3];

            timetableEntries.push({
                course: course._id,
                faculty: faculty._id,
                dayOfWeek: day,
                startTime: slot.start,
                endTime: slot.end,
                classroom: `Room ${101 + i}`,
                semester: 6,
                academicYear: '2025-2026',
                isActive: true,
            });
        }
        await Timetable.insertMany(timetableEntries);
        console.log(`✓ Created ${timetableEntries.length} timetable entries`);

        // === 7. CREATE ATTENDANCE RECORDS ===
        const attendanceRecords = [];
        const today = new Date();
        for (let daysAgo = 10; daysAgo >= 0; daysAgo--) {
            for (const course of courses) {
                for (let i = 0; i < 5; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - daysAgo);

                    const relevantEnrollments = enrollments.filter(e => e.course.toString() === course._id.toString());
                    for (const enrollment of relevantEnrollments) {
                        attendanceRecords.push({
                            student: enrollment.student,
                            course: course._id,
                            faculty: course.primaryFaculty,
                            date,
                            status: Math.random() > 0.1 ? 'Present' : 'Absent',
                        });
                    }
                }
            }
        }
        await Attendance.insertMany(attendanceRecords);
        console.log(`✓ Created ${attendanceRecords.length} attendance records`);

        // === 8. CREATE MARKS ===
        const marks = [];
        const examTypes = ['midterm', 'final', 'quiz'];
        for (const student of students) {
            for (const course of courses) {
                const isEnrolled = enrollments.some(e => e.student.toString() === student._id.toString() && e.course.toString() === course._id.toString());
                if (isEnrolled) {
                    for (const examType of examTypes) {
                        marks.push({
                            student: student._id,
                            course: course._id,
                            examType,
                            score: Math.floor(Math.random() * 80) + 20,
                            maxScore: 100,
                        });
                    }
                }
            }
        }
        await Marks.insertMany(marks);
        console.log(`✓ Created ${marks.length} marks entries`);

        // === 9. CREATE ASSIGNMENTS ===
        const assignments = [];
        for (const course of courses) {
            assignments.push({
                course: course._id,
                title: `Assignment 1: ${course.title}`,
                description: `Complete the assignment on ${course.title}`,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                maxMarks: 20,
            });
        }
        const assignmentDocs = await Assignment.insertMany(assignments);
        console.log('✓ Created 6 assignments');

        // === 10. CREATE SUBMISSIONS ===
        const submissions = [];
        for (const assignment of assignmentDocs) {
            const courseEnrollments = enrollments.filter(e => e.course.toString() === assignment.course.toString());
            for (const enrollment of courseEnrollments.slice(0, 10)) {
                submissions.push({
                    assignment: assignment._id,
                    student: enrollment.student,
                    fileUrl: `https://academix.edu/submissions/assignment_${assignment._id}_${enrollment.student}.pdf`,
                    submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    marksAwarded: Math.floor(Math.random() * 20),
                    feedback: 'Good work. Could be improved in section 2.',
                });
            }
        }
        await Submission.insertMany(submissions);
        console.log(`✓ Created ${submissions.length} submissions`);

        // === 11. CREATE QUIZZES ===
        const quizzes = await Quiz.insertMany(
            courses.map(course => ({
                course: course._id,
                title: `Quiz 1: ${course.title}`,
                description: `Quick assessment on ${course.title}`,
                duration: 30,
                totalMarks: 20,
                questions: [
                    { text: 'Question 1?', marks: 5, options: ['A', 'B', 'C', 'D'], correctAnswer: 0 },
                    { text: 'Question 2?', marks: 5, options: ['A', 'B', 'C', 'D'], correctAnswer: 1 },
                    { text: 'Question 3?', marks: 10, options: ['A', 'B', 'C', 'D'], correctAnswer: 2 },
                ],
                isPublished: true,
            }))
        );
        console.log('✓ Created 6 quizzes');

        // === 12. CREATE QUIZ ATTEMPTS ===
        const quizAttempts = [];
        for (const quiz of quizzes) {
            const courseEnrollments = enrollments.filter(e => e.course.toString() === quiz.course.toString());
            for (const enrollment of courseEnrollments.slice(0, 8)) {
                quizAttempts.push({
                    quiz: quiz._id,
                    student: enrollment.student,
                    score: Math.floor(Math.random() * 20),
                    answers: [0, 1, 2],
                    completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                });
            }
        }
        await QuizAttempt.insertMany(quizAttempts);
        console.log(`✓ Created ${quizAttempts.length} quiz attempts`);

        // === 13. CREATE INVOICES ===
        const invoices = [];
        for (const student of students) {
            const totalAmount = 5000 + Math.random() * 5000;
            const amountPaid = [0, totalAmount * 0.5, totalAmount][Math.floor(Math.random() * 3)];
            const status = amountPaid === 0 ? 'pending' : amountPaid === totalAmount ? 'paid_full' : 'paid_partial';

            invoices.push({
                student: student._id,
                academicYear: '2025-2026',
                semester: 6,
                totalAmount,
                amountPaid,
                status,
                description: 'Semester fees',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
        }
        const invoiceDocs = await Invoice.insertMany(invoices);
        console.log('✓ Created 30 invoices');

        // === 14. CREATE PAYMENTS ===
        const payments = [];
        const paymentMethods = ['credit_card', 'bank_transfer', 'check'];
        for (const invoice of invoiceDocs) {
            if (invoice.amountPaid > 0) {
                payments.push({
                    invoice: invoice._id,
                    student: invoice.student,
                    amount: invoice.amountPaid,
                    paymentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                });
            }
        }
        await Payment.insertMany(payments);
        console.log(`✓ Created ${payments.length} payment records`);

        // === 15. CREATE ANNOUNCEMENTS ===
        const notices = [];
        const announcements = [
            { title: 'Semester Registration Open', content: 'Registration for next semester is now open. Register before deadline.' },
            { title: 'Mid-Semester Exams Schedule', content: 'Mid-semester exams will be held from next week. Check your timetable.' },
            { title: 'Library Extended Hours', content: 'Library will remain open until 10 PM during exam season.' },
            { title: 'New Lab Equipment', content: 'New lab equipment has been installed in Lab 3. All students have access.' },
            { title: 'Scholarship Announcement', content: 'Merit-based scholarships are available. Apply by the deadline.' },
        ];
        for (const announcement of announcements) {
            notices.push({
                title: announcement.title,
                content: announcement.content,
                postedBy: adminUser._id,
                visibleTo: 'all',
            });
        }
        await Notice.insertMany(notices);
        console.log('✓ Created 5 announcements');

        // === 16. CREATE NOTIFICATIONS ===
        const notifications = [];
        for (const student of students.slice(0, 10)) {
            notifications.push({
                recipient: student.user,
                title: 'Assignment Submitted',
                message: 'Your assignment has been submitted successfully.',
                type: 'assignment',
                isRead: false,
            });
        }
        await Notification.insertMany(notifications);
        console.log('✓ Created 10 notifications');

        console.log('\n✅ Sample Data Imported Successfully!');
        console.log('📊 Created:');
        console.log('   • 1 Admin');
        console.log('   • 3 Faculty members');
        console.log('   • 30 Students across 3 departments');
        console.log('   • 6 Courses');
        console.log('   • 60 Enrollments');
        console.log('   • 6 Timetable entries');
        console.log(`   • ${attendanceRecords.length} Attendance records`);
        console.log(`   • ${marks.length} Marks entries`);
        console.log('   • 6 Assignments');
        console.log(`   • ${submissions.length} Submissions`);
        console.log('   • 6 Quizzes');
        console.log(`   • ${quizAttempts.length} Quiz attempts`);
        console.log('   • 30 Invoices');
        console.log(`   • ${payments.length} Payments`);
        console.log('   • 5 Announcements');
        console.log('   • 10 Notifications');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Connect to database and seed
mongoose().then(seedDatabase).catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
});
