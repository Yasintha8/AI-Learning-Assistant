import mongoose from "mongoose";

const learningPathSchema = new mongoose.Schema({
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
    topics: [{
        topicId: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        status: {
            type: String,
            enum: ['not-started', 'in-progress', 'mastered', 'weak'],
            default: 'not-started'
        },
        masteryScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        lastReviewedAt: {
            type: Date,
            default: null
        },
        source: {
            type: String,
            enum: ['quiz', 'flashcard', 'both', null],
            default: null
        }
    }],
    recommendedNext: [{
        topicId: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        masteryScore: {
            type: Number
        },
        reason: {
            type: String,
            default: ''
        }
    }]
}, {
    timestamps: true
});

// Index for faster queries and one learning path per user/document
learningPathSchema.index({ userId: 1, documentId: 1 }, { unique: true });

const LearningPath = mongoose.model('LearningPath', learningPathSchema);

export default LearningPath;