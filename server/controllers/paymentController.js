const paymentService = require('../services/paymentService');

const ok = (res, code, data, msg = 'Success') => res.status(code).json({ success: true, message: msg, data, error: null });
const err = (res, e) => res.status(e.status || 500).json({ success: false, data: null, error: { code: e.code || 'SERVER_ERROR', message: e.message } });

const processPayment = async (req, res) => {
    try {
        const payment = await paymentService.processPayment(req.user.id, req.user.role, req.body);
        return ok(res, 201, { payment }, 'Payment recorded successfully.');
    } catch (e) { return err(res, e); }
};

const getHistory = async (req, res) => {
    try {
        if (req.user.role === 'student') {
            const payments = await paymentService.getMyPaymentHistory(req.user.id);
            return ok(res, 200, { payments });
        } else if (req.user.role === 'admin') {
            const payments = await paymentService.getAllPaymentsAdmin();
            return ok(res, 200, { payments });
        } else {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized.' } });
        }
    } catch (e) { return err(res, e); }
};

module.exports = {
    processPayment, getHistory
};
