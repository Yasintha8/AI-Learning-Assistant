import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please provide a document title'],
        trim: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
    },
    fileType: {
        type: String,
        enum: ['pdf', 'docx', 'pptx', 'youtube', 'website'],
        required: true
    },
    extractedText: {
        type: String,
        default: ''
    },
    chunks: [{
        content: {
            type: String,
            required: true
        },
        pageNumber: {
            type: Number,
            default: 0
        },
        chunkIndex: {
            type: Number,
            required: true
        },
    }],
    uploadDate: {
        type: Date,
        default: Date.now
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'ready', 'error'],
        default: 'processing'
    },
    collectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
        default: null,
    },
}, {
    timestamps: true,
});

// Index for faster queries
documentSchema.index({ userId: 1, uploadDate: -1 });
documentSchema.index({ userId: 1, collectionId: 1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
