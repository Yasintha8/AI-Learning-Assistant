import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['streak_risk', 'cards_due'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        default: null,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    // One notification per user/type/day - lets generation safely no-op on repeat visits
    dedupeKey: {
        type: String,
        required: true,
        unique: true,
    },
}, {
    timestamps: true,
});

notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;