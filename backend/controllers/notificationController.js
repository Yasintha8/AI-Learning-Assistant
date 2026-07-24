import Document from '../models/Document.js';
import Quiz from '../models/Quiz.js';
import Flashcard from '../models/Flashcard.js';

const CARDS_DUE_STALE_DAYS = 3;
const MAX_QUIZ_ITEMS = 5;
const MAX_TOTAL_ITEMS = 8;

const isCardDue = (card) => {
    if (!card.lastReviewed) return true;
    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - CARDS_DUE_STALE_DAYS);
    return new Date(card.lastReviewed) < staleThreshold;
};

// @desc    Get the user's current to-do items - quizzes to complete, flashcards due for
// review, and a streak-at-risk nudge. Computed fresh on every call from live data, so an
// item disappears on its own once the underlying task is actually done (no read/unread state).
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const [pendingQuizzes, flashcardSets] = await Promise.all([
            Quiz.find({ userId, completedAt: null })
                .sort({ createdAt: -1 })
                .limit(MAX_QUIZ_ITEMS)
                .populate('documentId', 'title'),
            Flashcard.find({ userId }).populate('documentId', 'title'),
        ]);

        const allCards = flashcardSets.flatMap(set => set.cards);
        const hasCardActivity = (from, to) => allCards.some(card => {
            if (!card.lastReviewed) return false;
            const reviewedAt = new Date(card.lastReviewed);
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

        const notifications = [];

        if (!activeToday && activeYesterday) {
            notifications.push({
                id: 'streak_risk',
                type: 'streak_risk',
                title: "Don't lose your streak!",
                description: "You studied yesterday but haven't logged any activity today yet.",
                link: '/dashboard',
            });
        }

        pendingQuizzes.forEach(quiz => {
            notifications.push({
                id: `quiz_${quiz._id}`,
                type: 'quiz_due',
                title: quiz.title,
                description: `From "${quiz.documentId?.title || 'a document'}" - not completed yet.`,
                link: `/quizzes/${quiz._id}`,
            });
        });

        flashcardSets.forEach(set => {
            const dueCount = set.cards.filter(isCardDue).length;
            if (dueCount === 0 || !set.documentId) return;
            notifications.push({
                id: `flashcards_${set._id}`,
                type: 'flashcards_due',
                title: `${dueCount} flashcard${dueCount === 1 ? '' : 's'} to review`,
                description: `In "${set.documentId.title}"`,
                link: `/documents/${set.documentId._id}/flashcards`,
            });
        });

        res.status(200).json({
            success: true,
            data: {
                notifications: notifications.slice(0, MAX_TOTAL_ITEMS),
                count: notifications.length,
            },
        });
    } catch (error) {
        next(error);
    }
};