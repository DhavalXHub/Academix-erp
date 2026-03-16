const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });
const _notFound = (msg) => Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });

const processPayment = async (userId, userRole, data) => {
    // Both Admin (on behalf) and Student can trigger payments
    let studentId;

    if (userRole === 'student') {
        const profile = await Student.findOne({ user: userId });
        if (!profile) throw _bad('Student profile not found.');
        studentId = profile._id;
    } else if (userRole === 'admin') {
        studentId = data.studentId;
        if (!studentId) throw _bad('Must provide studentId when recording as admin.');
    } else {
        throw _bad('Unauthorized payment action.');
    }

    const invoice = await Invoice.findById(data.invoiceId);
    if (!invoice) throw _notFound('Invoice not found.');
    if (invoice.student.toString() !== studentId.toString()) throw _bad('Invoice does not belong to this student.');
    
    if (invoice.status === 'paid_full') throw _bad('Invoice is already paid in full.');

    const amountToPay = Number(data.amount);
    if (isNaN(amountToPay) || amountToPay <= 0) throw _bad('Invalid amount.');

    const remaining = invoice.amountDue - invoice.amountPaid;
    if (amountToPay > remaining) {
        throw _bad(`Payment exceeds remaining balance of ${remaining}.`);
    }

    // 1. Create Payment Record
    const payment = await Payment.create({
        invoice: invoice._id,
        student: studentId,
        amount: amountToPay,
        transactionId: data.transactionId,
        method: data.method,
    });

    // 2. Update Invoice Status
    invoice.amountPaid += amountToPay;
    if (invoice.amountPaid >= invoice.amountDue) {
        invoice.status = 'paid_full';
    } else {
        invoice.status = 'paid_partial';
    }

    await invoice.save();

    return payment;
};

const getMyPaymentHistory = async (userId) => {
    const student = await Student.findOne({ user: userId });
    if (!student) throw _bad('Student profile not found.');

    return Payment.find({ student: student._id })
        .populate('invoice', 'type amountDue')
        .sort({ paymentDate: -1 });
};

const getAllPaymentsAdmin = async () => {
    return Payment.find()
        .populate({
            path: 'student',
            populate: { path: 'user', select: 'name email' }
        })
        .populate('invoice', 'type amountDue')
        .sort({ paymentDate: -1 });
};

module.exports = {
    processPayment,
    getMyPaymentHistory,
    getAllPaymentsAdmin
};
