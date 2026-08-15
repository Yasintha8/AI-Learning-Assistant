import mongoose from 'mongoose';

const userCareerProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    currentRole: {
        type: String,
        required: [true, 'Please provide your current role or background status'],
        trim: true,
    },
    educationLevel: {
        type: String,
        default: 'Other',
    },
    currentSkills: [{
        skillName: { type: String, required: true },
        proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner'
        }
    }],
    targetRole: {
        type: String,
        required: [true, 'Please provide your target career goal or role'],
        trim: true,
    },
    timelineMonths: {
        type: Number,
        default: 6,
        min: 1,
        max: 36,
    },
    weeklyHours: {
        type: Number,
        default: 10,
        min: 1,
        max: 80,
    },
    preferredLearningStyle: {
        type: String,
        default: 'hands-on',
    }
}, {
    timestamps: true,
});

const UserCareerProfile = mongoose.model('UserCareerProfile', userCareerProfileSchema);

export default UserCareerProfile;
