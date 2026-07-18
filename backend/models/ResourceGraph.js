import mongoose from "mongoose";

const resourceGraphSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },
    concepts: [{
        conceptId: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        }
    }],
    resources: [{
        resourceId: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['article', 'video', 'course', 'paper', 'website'],
            default: 'website'
        },
        description: {
            type: String,
            default: ''
        },
        conceptIds: [{
            type: String
        }]
    }],
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// One resource graph per user/document
resourceGraphSchema.index({ userId: 1, documentId: 1 }, { unique: true });

const ResourceGraph = mongoose.model('ResourceGraph', resourceGraphSchema);

export default ResourceGraph;