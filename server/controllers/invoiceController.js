const invoiceService = require('../services/invoiceService');

const ok = (res, code, data, msg = 'Success') => res.status(code).json({ success: true, message: msg, data, error: null });
const err = (res, e) => res.status(e.status || 500).json({ success: false, data: null, error: { code: e.code || 'SERVER_ERROR', message: e.message } });

const createInvoice = async (req, res) => {
    try {
        const invoice = await invoiceService.createInvoice(req.body);
        return ok(res, 201, { invoice }, 'Invoice generated.');
    } catch (e) { return err(res, e); }
};

const getAllInvoices = async (req, res) => {
    try {
        const invoices = await invoiceService.getAllInvoices();
        return ok(res, 200, { invoices });
    } catch (e) { return err(res, e); }
};

const getInvoiceById = async (req, res) => {
    try {
        const invoice = await invoiceService.getInvoiceById(req.params.id);
        return ok(res, 200, { invoice });
    } catch (e) { return err(res, e); }
};

const updateInvoice = async (req, res) => {
    try {
        const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
        return ok(res, 200, { invoice }, 'Invoice updated.');
    } catch (e) { return err(res, e); }
};

const getMyInvoices = async (req, res) => {
    try {
        const invoices = await invoiceService.getMyInvoices(req.user.id);
        return ok(res, 200, { invoices });
    } catch (e) { return err(res, e); }
};

module.exports = {
    createInvoice, getAllInvoices, getInvoiceById, updateInvoice, getMyInvoices
};
