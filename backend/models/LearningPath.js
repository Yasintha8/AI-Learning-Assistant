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
        },
        knowledgeLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'proficient', null],
            default: null
        },
        knowledgeLevelReason: {
            type: String,
            default: ''
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
    }],
    studyPlan: [{
        topicId: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        knowledgeLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'proficient', null],
            default: null
        },
        action: {
            type: String,
            enum: ['reread-summary', 'redo-flashcards', 'retake-quiz', 'ask-ai-explain'],
            required: true
        },
        reason: {
            type: String,
            default: ''
        }
    }],
    // Concept-level weak areas mined from the user's incorrect quiz answers, clustered by AI.
    // Regenerated in the same pass as studyPlan (see studyPlanGeneratedAt/studyPlanStats below).
    weakConcepts: [{
        concept: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ''
        },
        relatedTopicId: {
            type: String,
            default: null
        },
        relatedTopicTitle: {
            type: String,
            default: null
        },
        missedCount: {
            type: Number,
            default: 0
        },
        // Dominant cognitive skill behind this cluster of mistakes (e.g. logical reasoning vs.
        // rote memory) - null when the underlying questions predate skillCategory tagging
        skillCategory: {
            type: String,
            enum: ['logical', 'analytical', 'conceptual', 'memory', 'application', null],
            default: null
        },
        action: {
            type: String,
            enum: ['reread-summary', 'redo-flashcards', 'retake-quiz', 'ask-ai-explain'],
            required: true
        },
        reason: {
            type: String,
            default: ''
        }
    }],
    // Deterministic (no AI call) breakdown of quiz accuracy per cognitive skill category -
    // recomputed on every recalculateMastery pass (see learningPathController.js), same as
    // topic mastery scores. Only categories the user has actually answered questions for appear.
    skillProfile: [{
        skillCategory: {
            type: String,
            enum: ['logical', 'analytical', 'conceptual', 'memory', 'application'],
            required: true
        },
        totalAnswered: {
            type: Number,
            default: 0
        },
        correctCount: {
            type: Number,
            default: 0
        },
        accuracy: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        status: {
            type: String,
            enum: ['weak', 'in-progress', 'mastered', 'insufficient-data'],
            default: 'insufficient-data'
        }
    }],
    // Bookkeeping to avoid re-calling Gemini when nothing has actually changed
    studyPlanGeneratedAt: {
        type: Date,
        default: null
    },
    studyPlanStats: {
        completedQuizCount: {
            type: Number,
            default: 0
        },
        totalFlashcardReviews: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Index for faster queries and one learning path per user/document
learningPathSchema.index({ userId: 1, documentId: 1 }, { unique: true });

const LearningPath = mongoose.model('LearningPath', learningPathSchema);

export default LearningPath;