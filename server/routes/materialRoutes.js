const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getMaterialsByCourse,
    uploadMaterial,
    deleteMaterial,
} = require('../controllers/materialController');

// Any authenticated user can potentially view materials (authorization happens in service)
router.get('/course/:courseId', protect, getMaterialsByCourse);

// Only faculty can upload and delete materials
router.post('/', protect, authorize('faculty'), uploadMaterial);
router.delete('/:id', protect, authorize('faculty'), deleteMaterial);

module.exports = router;
