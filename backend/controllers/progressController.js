import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import LearningPath from '../models/LearningPath.js';
import ChatHistory from '../models/ChatHistory.js';

const ACTIVITY_WINDOW_DAYS = 7;
const FOCUS_AREA_LIMIT = 5;

// Format date into a YYYY-MM-DD day key, adhering to 12:00 AM (midnight) to 11:59:59 PM boundaries
const dayKey = (date, timeZone) => {
    if (!date) return null;
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        if (timeZone) {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(d);
        }
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

// @desc    Get user learning statistics
// @route   GET /api/progress/dashboard
// @access  Private
export const getDashboard = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const timeZone = req.query?.timeZone || undefined;

        // Get counts
        const totalDocuments = await Document.countDocuments({ userId });
        const totalFlashcardSets = await Flashcard.countDocuments({ userId });
        const totalQuizzes = await Quiz.countDocuments({ userId });
        const completedQuizzes = await Quiz.countDocuments({ userId, completedAt: { $ne: null } });

        // Get flashcard statistics
        const flashcardSets = await Flashcard.find({ userId });
        let totalFlashcards = 0;
        let reviewedFlashcards = 0;
        let starredFlashcards = 0;

        flashcardSets.forEach(set => {
            totalFlashcards += set.cards.length;
            reviewedFlashcards += set.cards.filter(c => c.reviewCount > 0).length;
            starredFlashcards += set.cards.filter(c => c.isStarred).length;
        });

        // Get quiz statistics
        const quizzes = await Quiz.find({ userId, completedAt: { $ne: null } });
        const averageScore = quizzes.length > 0
            ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
            : 0;

        // Recent activity
        const recentDocuments = await Document.find({ userId })
            .sort({ lastAccessed: -1 })
            .limit(5)
            .select('title fileName lastAccessed status');

        const recentQuizzes = await Quiz.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('documentId', 'title')
            .select('title score totalQuestions completedAt');

        // --- Weekly activity + study streak, derived from actual learning actions ---
        // Day boundary: 12:00:00.000 AM to 11:59:59.999 PM
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Fetch window with a 1-day safety buffer for timezone offsets
        const windowStart = new Date(startOfToday);
        windowStart.setDate(windowStart.getDate() - (ACTIVITY_WINDOW_DAYS + 1));

        const [activeDocuments, activeQuizzes, learningPaths] = await Promise.all([
            Document.find({ userId, lastAccessed: { $gte: windowStart } }).select('lastAccessed uploadDate'),
            Quiz.find({ userId, completedAt: { $gte: windowStart } }).select('completedAt'),
            LearningPath.find({ userId }).populate('documentId', 'title')
        ]);

        // Created quizzes within the window (e.g. quiz generation actions)
        let createdQuizzes = [];
        try {
            const cqQuery = Quiz.find({ userId, createdAt: { $gte: windowStart } });
            if (cqQuery && typeof cqQuery.select === 'function') {
                createdQuizzes = await cqQuery.select('createdAt');
            }
        } catch {
            createdQuizzes = [];
        }

        // Chat interactions within the window
        let activeChats = [];
        try {
            const chatQuery = ChatHistory.find({ userId, 'messages.timestamp': { $gte: windowStart } });
            if (chatQuery && typeof chatQuery.select === 'function') {
                activeChats = await chatQuery.select('messages');
            }
        } catch {
            activeChats = [];
        }

        const activeDayCounts = new Map();
        const weeklyActivity = [];

        // Build 7 calendar days ending today (from today - 6 days up to today)
        for (let i = ACTIVITY_WINDOW_DAYS - 1; i >= 0; i--) {
            const date = new Date(startOfToday);
            date.setDate(date.getDate() - i);
            const key = dayKey(date, timeZone);
            let label = 'Day';
            try {
                label = timeZone
                    ? new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
                    : date.toLocaleDateString('en-US', { weekday: 'short' });
            } catch {
                label = date.toLocaleDateString('en-US', { weekday: 'short' });
            }
            activeDayCounts.set(key, 0);
            weeklyActivity.push({
                date: key,
                label,
                count: 0
            });
        }

        const recordActivity = (date) => {
            if (!date) return;
            const key = dayKey(date, timeZone);
            if (key && activeDayCounts.has(key)) {
                activeDayCounts.set(key, activeDayCounts.get(key) + 1);
            }
        };

        // 1. Document activity (accessed, read, uploaded)
        activeDocuments.forEach(doc => {
            if (doc.lastAccessed && new Date(doc.lastAccessed) >= windowStart) recordActivity(doc.lastAccessed);
            if (doc.uploadDate && new Date(doc.uploadDate) >= windowStart && String(doc.uploadDate) !== String(doc.lastAccessed)) {
                recordActivity(doc.uploadDate);
            }
        });

        // 2. Quiz activity (completed attempts)
        activeQuizzes.forEach(quiz => quiz.completedAt && recordActivity(quiz.completedAt));

        // 3. Quiz generation activity (created quizzes)
        createdQuizzes.forEach(quiz => quiz.createdAt && recordActivity(quiz.createdAt));

        // 4. Flashcard activity (generation, reviews)
        flashcardSets.forEach(set => {
            if (set.createdAt && new Date(set.createdAt) >= windowStart) {
                recordActivity(set.createdAt);
            }
            set.cards.forEach(card => {
                if (card.lastReviewed && new Date(card.lastReviewed) >= windowStart) {
                    recordActivity(card.lastReviewed);
                }
            });
        });

        // 5. Learning Path activity (generation, checking/accessing, study plan, topic reviews)
        learningPaths.forEach(lp => {
            if (lp.createdAt && new Date(lp.createdAt) >= windowStart) {
                recordActivity(lp.createdAt);
            }
            if (lp.studyPlanGeneratedAt && new Date(lp.studyPlanGeneratedAt) >= windowStart) {
                recordActivity(lp.studyPlanGeneratedAt);
            }
            if (lp.lastAccessed && new Date(lp.lastAccessed) >= windowStart) {
                recordActivity(lp.lastAccessed);
            }
            if (lp.updatedAt && new Date(lp.updatedAt) >= windowStart && String(lp.updatedAt) !== String(lp.createdAt)) {
                recordActivity(lp.updatedAt);
            }
            if (Array.isArray(lp.topics)) {
                lp.topics.forEach(t => {
                    if (t.lastReviewedAt && new Date(t.lastReviewedAt) >= windowStart) {
                        recordActivity(t.lastReviewedAt);
                    }
                });
            }
        });

        // 6. AI Q&A Chat interaction activity
        activeChats.forEach(chat => {
            chat.messages?.forEach(msg => {
                if (msg.role === 'user' && msg.timestamp && new Date(msg.timestamp) >= windowStart) {
                    recordActivity(msg.timestamp);
                }
            });
        });

        weeklyActivity.forEach(day => {
            day.count = activeDayCounts.get(day.date) || 0;
        });

        // Current streak = consecutive active days counting back from today
        let studyStreak = 0;
        const lastIdx = weeklyActivity.length - 1;
        const startIndex = weeklyActivity[lastIdx].count > 0 ? lastIdx : (weeklyActivity[lastIdx - 1]?.count > 0 ? lastIdx - 1 : lastIdx);
        for (let i = startIndex; i >= 0; i--) {
            if (weeklyActivity[i].count > 0) studyStreak++;
            else break;
        }

        // --- Overall mastery + focus areas, derived from learning paths ---
        const allTopics = learningPaths.flatMap(lp => lp.topics || []);
        const overallMastery = allTopics.length > 0
            ? Math.round(allTopics.reduce((sum, t) => sum + (t.masteryScore || 0), 0) / allTopics.length)
            : null;
        const topicsTracked = allTopics.length;

        const focusAreas = learningPaths
            .flatMap(lp => (lp.weakConcepts || []).map(w => ({
                concept: w.concept,
                description: w.description,
                missedCount: w.missedCount,
                action: w.action,
                relatedTopicTitle: w.relatedTopicTitle,
                documentId: lp.documentId?._id,
                documentTitle: lp.documentId?.title
            })))
            .sort((a, b) => b.missedCount - a.missedCount)
            .slice(0, FOCUS_AREA_LIMIT);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalDocuments,
                    totalFlashcardSets,
                    totalFlashcards,
                    reviewedFlashcards,
                    starredFlashcards,
                    totalQuizzes,
                    completedQuizzes,
                    averageScore,
                    overallMastery,
                    topicsTracked,
                    studyStreak
                },
                weeklyActivity,
                focusAreas,
                recentActivity: {
                    documents: recentDocuments,
                    quizzes: recentQuizzes
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
