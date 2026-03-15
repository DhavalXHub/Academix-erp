const express = require('express');
const router = express.Router();
const Marks = require('../models/Marks');
const Student = require('../models/Student');
const PDFDocument = require('pdfkit');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Enter/Update Marks
// @route   POST /api/marks
router.post('/', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const { studentId, subjectId, examType, score, maxScore } = req.body;

        const student = await Student.findOne({ user: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        let marks = await Marks.findOne({
            student: student._id,
            subject: subjectId,
            examType
        });

        if (marks) {
            // Update existing
            marks.score = score;
            marks.maxScore = maxScore;
            await marks.save();
        } else {
            // Create new
            marks = await Marks.create({
                student: student._id,
                subject: subjectId,
                examType,
                score,
                maxScore
            });
        }

        res.json(marks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get Marks for logged in student
// @route   GET /api/marks/my
router.get('/my', protect, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const marks = await Marks.find({ student: student._id }).populate('subject');
        res.json(marks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Download Marksheet PDF
// @route   GET /api/marks/download/:semester
router.get('/download/:semester', protect, authorize('student'), async (req, res) => {
    try {
        const semester = parseInt(req.params.semester);
        const student = await Student.findOne({ user: req.user.id }).populate('user');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const marks = await Marks.find({ student: student._id }).populate('subject');
        // In a real app, filter by semester. For now, we fetch all.

        // Create PDF
        const doc = new PDFDocument();

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=marksheet_sem${semester}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // PDF Content
        doc.fontSize(20).text('Academix University', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('Official Marksheet', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Name: ${student.user.name}`);
        doc.text(`Roll Number: ${student.rollNumber}`);
        doc.text(`Department: ${student.department}`);
        doc.text(`Semester: ${semester}`); // Dynamic based on request, or student.semester
        doc.moveDown();

        doc.text('------------------------------------------------------------');
        doc.moveDown();

        // Table Header
        doc.text('Subject                                  Score    Max Score');
        doc.moveDown(0.5);

        // Table Rows
        let totalScore = 0;
        let totalMax = 0;

        marks.forEach(mark => {
            // Basic columns alignment
            const subjectName = mark.subject.name.padEnd(40, ' ');
            const score = mark.score.toString().padEnd(8, ' ');
            const max = mark.maxScore.toString();

            doc.text(`${subjectName} ${score} ${max}`);
            totalScore += mark.score;
            totalMax += mark.maxScore;
        });

        doc.moveDown();
        doc.text('------------------------------------------------------------');
        doc.moveDown();

        const percentage = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(2) : 0;
        doc.fontSize(14).text(`Total: ${totalScore} / ${totalMax}   (${percentage}%)`, { align: 'right' });

        if (percentage >= 40) {
            doc.fillColor('green').text('RESULT: PASS', { align: 'right' });
        } else {
            doc.fillColor('red').text('RESULT: FAIL', { align: 'right' });
        }

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
