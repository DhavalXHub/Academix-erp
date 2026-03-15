const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Faculty',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        fileUrl: {
            type: String,
            required: true, // S3 or similar presigned URL
        },
        type: {
            type: String,
            enum: ['notes', 'ppt', 'video', 'other'],
            default: 'notes',
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

courseMaterialSchema.index({ course: 1, uploadedAt: -1 });

module.exports = mongoose.model('CourseMaterial', courseMaterialSchema);
