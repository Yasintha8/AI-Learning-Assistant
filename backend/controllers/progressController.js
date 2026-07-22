import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import LearningPath from '../models/LearningPath.js';

const ACTIVITY_WINDOW_DAYS = 7;
const FOCUS_AREA_LIMIT = 5;

const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

// @desc    Get user learning statistics
// @route   GET /api/progress/dashboard
// @access  Private
export const getDashboard = async (req, res, next) => {
    try {
        const userId = req.user._id;

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

        // --- Weekly activity + real study streak, derived from actual timestamps ---
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const windowStart = new Date(startOfToday);
        windowStart.setDate(windowStart.getDate() - (ACTIVITY_WINDOW_DAYS - 1));

        const [activeDocuments, activeQuizzes] = await Promise.all([
            Document.find({ userId, lastAccessed: { $gte: windowStart } }).select('lastAccessed'),
            Quiz.find({ userId, completedAt: { $gte: windowStart } }).select('completedAt')
        ]);

        const activeDayCounts = new Map();
        const recordActivity = (date) => {
            const key = dayKey(date);
            activeDayCounts.set(key, (activeDayCounts.get(key) || 0) + 1);
        };

        activeDocuments.forEach(doc => doc.lastAccessed && recordActivity(doc.lastAccessed));
        activeQuizzes.forEach(quiz => quiz.completedAt && recordActivity(quiz.completedAt));
        flashcardSets.forEach(set => {
            set.cards.forEach(card => {
                if (card.lastReviewed && new Date(card.lastReviewed) >= windowStart) {
                    recordActivity(card.lastReviewed);
                }
            });
        });

        const weeklyActivity = [];
        for (let i = ACTIVITY_WINDOW_DAYS - 1; i >= 0; i--) {
            const date = new Date(startOfToday);
            date.setDate(date.getDate() - i);
            const key = dayKey(date);
            weeklyActivity.push({
                date: key,
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count: activeDayCounts.get(key) || 0
            });
        }

        // Current streak = consecutive active days counting back from today
        let studyStreak = 0;
        for (let i = weeklyActivity.length - 1; i >= 0; i--) {
            if (weeklyActivity[i].count > 0) studyStreak++;
            else break;
        }

        // --- Overall mastery + focus areas, derived from learning paths ---
        const learningPaths = await LearningPath.find({ userId }).populate('documentId', 'title');

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
