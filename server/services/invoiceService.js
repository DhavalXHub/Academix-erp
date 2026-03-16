const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const User = require('../models/User');

const _bad = (msg) => Object.assign(new Error(msg), { code: 'BAD_REQUEST', status: 400 });
const _notFound = (msg) => Object.assign(new Error(msg), { code: 'NOT_FOUND', status: 404 });

const createInvoice = async (data) => {
    // Admin operation
    const student = await Student.findOne({ _id: data.studentId });
    if (!student) throw _bad('Student not found.');

    if (data.amountDue <= 0) throw _bad('Amount due must be positive.');

    const invoice = await Invoice.create({
        student: student._id,
        amountDue: data.amountDue,
        dueDate: data.dueDate,
        type: data.type,
        description: data.description,
    });

    return invoice;
};

const getAllInvoices = async () => {
    // Admin list
    return Invoice.find()
        .populate({
            path: 'student',
            select: 'enrollmentYear rollNumber',
            populate: { path: 'user', select: 'name email' }
        })
        .sort({ createdAt: -1 });
};

const getInvoiceById = async (id) => {
    const invoice = await Invoice.findById(id).populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
    });
    if (!invoice) throw _notFound('Invoice not found.');
    return invoice;
};

const updateInvoice = async (id, data) => {
    // Only allows updating fields that shouldn't mess up accounting.
    // E.g. description, dueDate.
    const invoice = await Invoice.findById(id);
    if (!invoice) throw _notFound('Invoice not found.');

    if (data.dueDate) invoice.dueDate = data.dueDate;
    if (data.description !== undefined) invoice.description = data.description;
    
    // You typically don't change amountDue once payments exist, but for simplistic ERP...
    if (data.amountDue && invoice.amountPaid === 0) {
        invoice.amountDue = data.amountDue;
    } else if (data.amountDue && invoice.amountPaid > 0) {
        throw _bad('Cannot modify amount on an invoice that already has partial/full payments.');
    }

    await invoice.save();
    return invoice;
};

const getMyInvoices = async (userId) => {
    const student = await Student.findOne({ user: userId });
    if (!student) throw _bad('Student profile not found.');

    return Invoice.find({ student: student._id }).sort({ createdAt: -1 });
};

module.exports = {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoice,
    getMyInvoices,
};
