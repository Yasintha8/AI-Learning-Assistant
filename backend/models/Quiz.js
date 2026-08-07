import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: true,
        trim: true
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: {
            type: [String],
            required: true,
            validate: [array => array.length === 4, 'Must have exactly 4 options']
        },
        correctOption: {
            type: Number,
            required: true,
            min: 1,
            max: 4
        },
        explanation: {
            type: String,
            default: ''
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        topicId: {
            type: String,
            default: null
        },
        topicTitle: {
            type: String,
            default: null
        },
        // Cognitive skill the question primarily exercises - lets Weak Areas show not just
        // *what* topic a student struggles with, but *what kind of thinking* trips them up
        skillCategory: {
            type: String,
            enum: ['logical', 'analytical', 'conceptual', 'memory', 'application', null],
            default: null
        }
    }],
    userAnswers: [{
        questionIndex: {
            type: Number,
            required: true
        },
        selectedAnswer: {
            type: String,
            required: true
        },
        isCorrect: {
            type: Boolean,
            required: true
        },
        answeredAt: {
            type: Date,
            default: Date.now
        }
    }],
    score: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
quizSchema.index({ userId: 1, documentId: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;