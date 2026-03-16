const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Subject = require('./models/Subject');
const Attendance = require('./models/Attendance');
const Marks = require('./models/Marks');
const Invoice = require('./models/Invoice');
const Quiz = require('./models/Quiz');
const Notice = require('./models/Notice');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
    try {
        await User.deleteMany();
        await Student.deleteMany();
        await Faculty.deleteMany();
        await Subject.deleteMany();
        await Attendance.deleteMany();
        await Marks.deleteMany();
        await Invoice.deleteMany();
        await Quiz.deleteMany();
        await Notice.deleteMany();
        console.log('Data Cleared...');

        const adminUser = await User.create({ name: 'Admin User', email: 'admin@academix.edu', password: 'password123', role: 'admin' });
        const facultyUser = await User.create({ name: 'Prof. John Doe', email: 'faculty@academix.edu', password: 'password123', role: 'faculty' });
        const studentUser = await User.create({ name: 'Alice Smith', email: 'student@academix.edu', password: 'password123', role: 'student' });
        const studentUser2 = await User.create({ name: 'Bob Johnson', email: 'student2@academix.edu', password: 'password123', role: 'student' });

        const faculty = await Faculty.create({ user: facultyUser._id, employeeId: 'EMP001', department: 'Computer Science', designation: 'HOD' });
        const student = await Student.create({ user: studentUser._id, rollNumber: 'CS2026001', department: 'Computer Science', semester: 6, batchYear: 2026 });
        const student2 = await Student.create({ user: studentUser2._id, rollNumber: 'CS2026002', department: 'Computer Science', semester: 6, batchYear: 2026 });

        const subjects = await Subject.insertMany([
            { name: 'Computer Networks', code: 'CS601', credits: 4, department: 'Computer Science', semester: 6, faculty: faculty._id },
            { name: 'Web Development', code: 'CS602', credits: 4, department: 'Computer Science', semester: 6, faculty: faculty._id },
            { name: 'Operating Systems', code: 'CS603', credits: 3, department: 'Computer Science', semester: 6, faculty: faculty._id },
            { name: 'Data Structures', code: 'CS604', credits: 4, department: 'Computer Science', semester: 6, faculty: faculty._id }
        ]);
        const subCN = subjects[0], subWeb = subjects[1], subOS = subjects[2], subDS = subjects[3];

        // Attendance for Alice
        const today = new Date();
        const attData = [];
        const allSubs = [subCN, subWeb, subOS, subDS];
        for (let i = 1; i <= 8; i++) {
            const date = new Date(today.getFullYear(), today.getMonth(), i);
            allSubs.forEach(sub => {
                attData.push({ student: student._id, subject: sub._id, date, status: i === 6 ? 'Absent' : 'Present', markedBy: faculty._id });
            });
        }
        // Attendance for Bob
        for (let i = 1; i <= 5; i++) {
            const date = new Date(today.getFullYear(), today.getMonth(), i);
            [subCN, subWeb].forEach(sub => {
                attData.push({ student: student2._id, subject: sub._id, date, status: 'Present', markedBy: faculty._id });
            });
        }
        await Attendance.insertMany(attData);

        await Marks.insertMany([
            { student: student._id, subject: subCN._id, examType: 'Mid-Sem', score: 25, maxScore: 30 },
            { student: student._id, subject: subWeb._id, examType: 'Mid-Sem', score: 28, maxScore: 30 },
            { student: student._id, subject: subOS._id, examType: 'Mid-Sem', score: 20, maxScore: 30 },
            { student: student._id, subject: subDS._id, examType: 'Mid-Sem', score: 29, maxScore: 30 }
        ]);

        await Invoice.insertMany([
            { student: student._id, type: 'tuition', description: 'Semester 6 Tuition Fee', amountDue: 45000, amountPaid: 0, dueDate: new Date(2026, 5, 30), status: 'pending' },
            { student: student._id, type: 'library_fine', description: 'Library Fine', amountDue: 500, amountPaid: 0, dueDate: new Date(2026, 1, 15), status: 'pending' },
            { student: student._id, type: 'tuition', description: 'Semester 5 Tuition Fee', amountDue: 45000, amountPaid: 45000, dueDate: new Date(2025, 11, 31), status: 'paid_full' }
        ]);

        await Quiz.insertMany([
            {
                title: 'Web Dev Basics', description: 'Test your HTML/CSS knowledge',
                course: faculty._id, faculty: faculty._id, timeLimitMinutes: 10, isActive: true,
                questions: [
                    { text: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Text Machine Language', 'Hyper Tool Multi Language', 'None'], correctOptionIndex: 0 },
                    { text: 'Which tag is used for hyperlinks?', options: ['<link>', '<a>', '<href>', '<p>'], correctOptionIndex: 1 },
                    { text: 'Which CSS property controls text size?', options: ['font-style', 'text-size', 'font-size', 'text-weight'], correctOptionIndex: 2 },
                    { text: 'What does CSS stand for?', options: ['Computer Style Sheets', 'Creative Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets'], correctOptionIndex: 2 }
                ]
            },
            {
                title: 'Computer Networks Quiz', description: 'OSI Layers and TCP/IP fundamentals',
                course: faculty._id, faculty: faculty._id, timeLimitMinutes: 15, isActive: true,
                questions: [
                    { text: 'How many layers are in the OSI model?', options: ['5', '6', '7', '8'], correctOptionIndex: 2 },
                    { text: 'Which layer is responsible for routing?', options: ['Data Link', 'Transport', 'Network', 'Physical'], correctOptionIndex: 2 },
                    { text: 'What does TCP stand for?', options: ['Transfer Control Protocol', 'Transmission Control Protocol', 'Transport Control Protocol', 'Terminal Control Protocol'], correctOptionIndex: 1 }
                ]
            }
        ]);

        await Notice.insertMany([
            { title: 'Exam Registration Deadline Extended', content: 'The last date for semester exam registration has been extended to 15th March 2026. All students must complete their registrations before the deadline.', category: 'Urgent', postedBy: adminUser._id, targetAudience: 'all' },
            { title: 'Annual Tech Fest – Technova 2026', content: 'Get ready for the biggest tech event of the year! Hackathons, coding contests, and robotics workshops. Registration starts next week.', category: 'Event', postedBy: adminUser._id, targetAudience: 'all' },
            { title: 'Mid-Semester Examination Schedule Released', content: 'The mid-semester examination schedule has been published. Students must check their hall tickets and confirm examination centers.', category: 'Academic', postedBy: facultyUser._id, targetAudience: 'student' },
            { title: 'Library Closed This Sunday', content: 'The Central Library will remain closed on Sunday (March 15, 2026) due to scheduled maintenance. Digital resources remain accessible online.', category: 'General', postedBy: adminUser._id, targetAudience: 'all' },
            { title: 'Faculty Meeting – Curriculum Review', content: 'All faculty members must attend the curriculum review meeting on March 12 at 2:00 PM in Conference Hall B. Attendance is mandatory.', category: 'Urgent', postedBy: adminUser._id, targetAudience: 'faculty' }
        ]);

        console.log('\n✅ Sample Data Imported Successfully!');
        console.log('\nTest Credentials:');
        console.log('  Admin:    admin@academix.edu    / password123');
        console.log('  Faculty:  faculty@academix.edu  / password123');
        console.log('  Student:  student@academix.edu  / password123');
        console.log('  Student2: student2@academix.edu / password123');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
