import Document from '../models/Document.js';
import Quiz from '../models/Quiz.js';
import Flashcard from '../models/Flashcard.js';
import Notification from '../models/Notification.js';

const NOTIFICATION_LIST_LIMIT = 20;
const CARDS_DUE_STALE_DAYS = 3;

const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

// Duplicate dedupeKey means today's notification of this type was already generated - safe to ignore
const createIfNew = async (notification) => {
    try {
        await Notification.create(notification);
    } catch (error) {
        if (error.code !== 11000) throw error;
    }
};

// There's no job scheduler in this app, so notifications are generated lazily whenever
// a user's notification list is requested, instead of on a cron.
const generateTodaysNotifications = async (userId) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const today = dayKey(startOfToday);

    const flashcardSets = await Flashcard.find({ userId }).select('cards');
    const allCards = flashcardSets.flatMap(set => set.cards);
    const hasCardActivity = (from, to) => allCards.some(c => {
        if (!c.lastReviewed) return false;
        const reviewedAt = new Date(c.lastReviewed);
        return reviewedAt >= from && (!to || reviewedAt < to);
    });

    const [documentToday, quizToday, documentYesterday, quizYesterday] = await Promise.all([
        Document.exists({ userId, lastAccessed: { $gte: startOfToday } }),
        Quiz.exists({ userId, completedAt: { $gte: startOfToday } }),
        Document.exists({ userId, lastAccessed: { $gte: startOfYesterday, $lt: startOfToday } }),
        Quiz.exists({ userId, completedAt: { $gte: startOfYesterday, $lt: startOfToday } }),
    ]);

    const activeToday = !!documentToday || !!quizToday || hasCardActivity(startOfToday);
    const activeYesterday = !!documentYesterday || !!quizYesterday || hasCardActivity(startOfYesterday, startOfToday);

    if (!activeToday && activeYesterday) {
        await createIfNew({
            userId,
            type: 'streak_risk',
            title: "Don't lose your streak!",
            description: "You studied yesterday but haven't logged any activity today yet. Review something to keep your streak alive.",
            link: '/dashboard',
            dedupeKey: `${userId}_streak_risk_${today}`,
        });
    }

    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - CARDS_DUE_STALE_DAYS);
    const dueCount = allCards.filter(c => !c.lastReviewed || new Date(c.lastReviewed) < staleThreshold).length;

    if (dueCount > 0) {
        await createIfNew({
            userId,
            type: 'cards_due',
            title: 'Flashcards ready for review',
            description: `You have ${dueCount} flashcard${dueCount === 1 ? '' : 's'} ${dueCount === 1 ? 'that\'s' : 'that are'} due for review.`,
            link: '/flashcards',
            dedupeKey: `${userId}_cards_due_${today}`,
        });
    }
};

// @desc    Get notifications for the logged-in user (generates today's, if any conditions are met)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        await generateTodaysNotifications(userId);

        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ userId }).sort({ createdAt: -1 }).limit(NOTIFICATION_LIST_LIMIT),
            Notification.countDocuments({ userId, isRead: false }),
        ]);

        res.status(200).json({
            success: true,
            data: { notifications, unreadCount },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found',
                statusCode: 404
            });
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllNotificationsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};