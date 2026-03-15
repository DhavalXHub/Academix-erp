const materialService = require('../services/materialService');

const ok = (res, code, data, msg = 'Success') =>
    res.status(code).json({ success: true, message: msg, data, error: null });
const err = (res, e) =>
    res.status(e.status || 500).json({ success: false, data: null, error: { code: e.code || 'SERVER_ERROR', message: e.message } });

const getMaterialsByCourse = async (req, res) => {
    try {
        const materials = await materialService.getMaterialsByCourse(req.user.id, req.user.role, req.params.courseId);
        return ok(res, 200, { materials });
    } catch (e) { return err(res, e); }
};

const uploadMaterial = async (req, res) => {
    try {
        const { courseId, title, description, fileUrl, type } = req.body;
        if (!courseId || !title || !fileUrl) {
            return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'courseId, title, and fileUrl required.' } });
        }
        const material = await materialService.uploadMaterial(req.user.id, courseId, { title, description, fileUrl, type });
        return ok(res, 201, { material }, 'Material uploaded successfully.');
    } catch (e) { return err(res, e); }
};

const deleteMaterial = async (req, res) => {
    try {
        await materialService.deleteMaterial(req.user.id, req.params.id);
        return ok(res, 200, null, 'Material deleted.');
    } catch (e) { return err(res, e); }
};

module.exports = { getMaterialsByCourse, uploadMaterial, deleteMaterial };
