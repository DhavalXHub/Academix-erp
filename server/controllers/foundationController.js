const InstitutionSettings = require('../models/InstitutionSettings');
const Department = require('../models/Department');
const Program = require('../models/Program');
const Batch = require('../models/Batch');
const Section = require('../models/Section');

const ok = (res, status, data, message = 'Success') => {
    res.status(status).json({ success: true, message, data, error: null, requestId: res.getHeader('X-Request-Id') });
};

const fail = (res, status, code, message) => {
    res.status(status).json({ success: false, data: null, error: { code, message }, requestId: res.getHeader('X-Request-Id') });
};

const parseActive = (value) => {
    if (value === undefined || value === 'all') return undefined;
    return value === true || value === 'true';
};

const getSettings = async (req, res, next) => {
    try {
        let settings = await InstitutionSettings.findOne({});
        if (!settings) settings = await InstitutionSettings.create({});
        ok(res, 200, { settings });
    } catch (err) {
        next(err);
    }
};

const updateSettings = async (req, res, next) => {
    try {
        const allowed = [
            'name', 'code', 'logoUrl', 'website', 'contactEmail', 'contactPhone',
            'address', 'activeAcademicYear', 'attendanceThreshold', 'defaultCurrency', 'gradingScheme',
        ];
        const payload = {};
        allowed.forEach((key) => {
            if (req.body[key] !== undefined) payload[key] = req.body[key];
        });

        const settings = await InstitutionSettings.findOneAndUpdate({}, payload, {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        });

        ok(res, 200, { settings }, 'Institution settings updated.');
    } catch (err) {
        next(err);
    }
};

const listDepartments = async (req, res, next) => {
    try {
        const query = {};
        const active = parseActive(req.query.isActive);
        if (active !== undefined) query.isActive = active;
        const departments = await Department.find(query)
            .populate('headOfDepartment', 'employeeId designation department')
            .sort({ name: 1 });
        ok(res, 200, { departments });
    } catch (err) {
        next(err);
    }
};

const createDepartment = async (req, res, next) => {
    try {
        const { code, name } = req.body;
        if (!code || !name) return fail(res, 400, 'MISSING_FIELDS', 'code and name are required.');
        const department = await Department.create(req.body);
        ok(res, 201, { department }, 'Department created.');
    } catch (err) {
        next(err);
    }
};

const updateDepartment = async (req, res, next) => {
    try {
        const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!department) return fail(res, 404, 'NOT_FOUND', 'Department not found.');
        ok(res, 200, { department }, 'Department updated.');
    } catch (err) {
        next(err);
    }
};

const listPrograms = async (req, res, next) => {
    try {
        const query = {};
        const active = parseActive(req.query.isActive);
        if (active !== undefined) query.isActive = active;
        if (req.query.department) query.department = req.query.department;
        const programs = await Program.find(query).populate('department', 'code name').sort({ name: 1 });
        ok(res, 200, { programs });
    } catch (err) {
        next(err);
    }
};

const createProgram = async (req, res, next) => {
    try {
        const { code, name, department } = req.body;
        if (!code || !name || !department) return fail(res, 400, 'MISSING_FIELDS', 'code, name, and department are required.');
        const program = await Program.create(req.body);
        ok(res, 201, { program }, 'Program created.');
    } catch (err) {
        next(err);
    }
};

const updateProgram = async (req, res, next) => {
    try {
        const program = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!program) return fail(res, 404, 'NOT_FOUND', 'Program not found.');
        ok(res, 200, { program }, 'Program updated.');
    } catch (err) {
        next(err);
    }
};

const listBatches = async (req, res, next) => {
    try {
        const query = {};
        const active = parseActive(req.query.isActive);
        if (active !== undefined) query.isActive = active;
        if (req.query.program) query.program = req.query.program;
        const batches = await Batch.find(query).populate({ path: 'program', select: 'code name department', populate: { path: 'department', select: 'code name' } }).sort({ startYear: -1 });
        ok(res, 200, { batches });
    } catch (err) {
        next(err);
    }
};

const createBatch = async (req, res, next) => {
    try {
        const { name, program, academicYear, startYear, endYear } = req.body;
        if (!name || !program || !academicYear || !startYear || !endYear) {
            return fail(res, 400, 'MISSING_FIELDS', 'name, program, academicYear, startYear, and endYear are required.');
        }
        if (Number(endYear) < Number(startYear)) return fail(res, 400, 'INVALID_RANGE', 'endYear must be greater than or equal to startYear.');
        const batch = await Batch.create(req.body);
        ok(res, 201, { batch }, 'Batch created.');
    } catch (err) {
        next(err);
    }
};

const updateBatch = async (req, res, next) => {
    try {
        if (req.body.startYear && req.body.endYear && Number(req.body.endYear) < Number(req.body.startYear)) {
            return fail(res, 400, 'INVALID_RANGE', 'endYear must be greater than or equal to startYear.');
        }
        const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!batch) return fail(res, 404, 'NOT_FOUND', 'Batch not found.');
        ok(res, 200, { batch }, 'Batch updated.');
    } catch (err) {
        next(err);
    }
};

const listSections = async (req, res, next) => {
    try {
        const query = {};
        const active = parseActive(req.query.isActive);
        if (active !== undefined) query.isActive = active;
        if (req.query.batch) query.batch = req.query.batch;
        const sections = await Section.find(query)
            .populate({ path: 'batch', select: 'name academicYear program', populate: { path: 'program', select: 'code name' } })
            .populate('classAdvisor', 'employeeId designation department')
            .sort({ semester: 1, name: 1 });
        ok(res, 200, { sections });
    } catch (err) {
        next(err);
    }
};

const createSection = async (req, res, next) => {
    try {
        const { name, batch, semester } = req.body;
        if (!name || !batch || !semester) return fail(res, 400, 'MISSING_FIELDS', 'name, batch, and semester are required.');
        const section = await Section.create(req.body);
        ok(res, 201, { section }, 'Section created.');
    } catch (err) {
        next(err);
    }
};

const updateSection = async (req, res, next) => {
    try {
        const section = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!section) return fail(res, 404, 'NOT_FOUND', 'Section not found.');
        ok(res, 200, { section }, 'Section updated.');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getSettings,
    updateSettings,
    listDepartments,
    createDepartment,
    updateDepartment,
    listPrograms,
    createProgram,
    updateProgram,
    listBatches,
    createBatch,
    updateBatch,
    listSections,
    createSection,
    updateSection,
};
