import mongoose from 'mongoose';

const careerPathSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserCareerProfile',
        required: true,
    },
    targetRole: {
        type: String,
        required: true,
    },
    summary: {
        type: String,
        default: '',
    },
    skillGaps: [{
        skill: { type: String, required: true },
        importance: {
            type: String,
            enum: ['critical', 'recommended', 'optional'],
            default: 'critical',
        }
    }],
    milestones: [{
        milestoneId: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        estimatedWeeks: { type: Number, default: 2 },
        status: {
            type: String,
            enum: ['not-started', 'in-progress', 'completed'],
            default: 'not-started',
        },
        topics: [{
            title: { type: String, required: true },
            isCompleted: { type: Boolean, default: false }
        }],
        suggestedProjects: [{
            title: { type: String, required: true },
            description: { type: String, default: '' }
        }],
        linkedDocumentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
            default: null,
        }
    }],
    readinessScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    chatHistory: [{
        role: {
            type: String,
            enum: ['user', 'model', 'assistant'],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        }
    }]
}, {
    timestamps: true,
});

careerPathSchema.index({ userId: 1, profileId: 1 });

const CareerPath = mongoose.model('CareerPath', careerPathSchema);

export default CareerPath;
