import Document from '../models/Document.js';
import LearningPath from '../models/LearningPath.js';
import Quiz from '../models/Quiz.js';
import Flashcard from '../models/Flashcard.js';
import * as geminiService from '../utils/geminiService.js';

// How many of the most recent quiz-question attempts (per topic) count toward mastery
const RECENT_QUIZ_ATTEMPTS_LIMIT = 20;
// Number of reviews of a flashcard that counts as "fully practiced" (100% proficiency)
const FLASHCARD_REVIEWS_FOR_FULL_CREDIT = 4;
// When a topic has both quiz and flashcard signal, quiz accuracy counts more
// since it directly measures correctness, while flashcards only measure exposure
const QUIZ_WEIGHT = 0.7;
const FLASHCARD_WEIGHT = 0.3;

const MASTERY_THRESHOLD = 85;
const IN_PROGRESS_THRESHOLD = 50;

// Recommend at most this many weakest topics
const RECOMMEND_LIMIT = 5;

// Simple, explainable status derivation from a 0-100 masteryScore
const deriveStatus = (masteryScore, hasActivity) => {
    if (!hasActivity) return 'not-started';
    if (masteryScore >= MASTERY_THRESHOLD) return 'mastered';
    if (masteryScore >= IN_PROGRESS_THRESHOLD) return 'in-progress';
    return 'weak';
};

// Compute a topic's mastery from the user's recent quiz answers and flashcard reviews
const computeTopicStats = (topicId, quizzes, flashcardSets) => {
    // Collect answered quiz questions tagged with this topic, most recent first
    const quizAttempts = [];
    for (const quiz of quizzes) {
        quiz.questions.forEach((question, index) => {
            if (question.topicId !== topicId) return;

            const userAnswer = quiz.userAnswers.find(a => a.questionIndex === index);
            if (!userAnswer) return;

            quizAttempts.push({
                isCorrect: userAnswer.isCorrect,
                answeredAt: userAnswer.answeredAt || quiz.completedAt
            });
        });
    }
    quizAttempts.sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt));
    const recentAttempts = quizAttempts.slice(0, RECENT_QUIZ_ATTEMPTS_LIMIT);

    let quizAccuracy = null;
    if (recentAttempts.length > 0) {
        const correctCount = recentAttempts.filter(a => a.isCorrect).length;
        quizAccuracy = (correctCount / recentAttempts.length) * 100;
    }

    // Collect flashcards tagged with this topic
    const topicCards = [];
    for (const set of flashcardSets) {
        set.cards.forEach(card => {
            if (card.topicId === topicId) topicCards.push(card);
        });
    }

    let flashcardProficiency = null;
    if (topicCards.length > 0) {
        const perCardScores = topicCards.map(card =>
            Math.min(100, (card.reviewCount / FLASHCARD_REVIEWS_FOR_FULL_CREDIT) * 100)
        );
        flashcardProficiency = perCardScores.reduce((sum, s) => sum + s, 0) / perCardScores.length;
    }

    // Most recent activity date across both sources
    const activityDates = [];
    if (recentAttempts.length > 0) activityDates.push(new Date(recentAttempts[0].answeredAt));
    topicCards.forEach(card => {
        if (card.lastReviewed) activityDates.push(new Date(card.lastReviewed));
    });
    const lastReviewedAt = activityDates.length > 0
        ? new Date(Math.max(...activityDates.map(d => d.getTime())))
        : null;

    // Weighted average when both sources exist; otherwise use whichever is available
    let masteryScore = null;
    let source = null;
    if (quizAccuracy !== null && flashcardProficiency !== null) {
        masteryScore = (quizAccuracy * QUIZ_WEIGHT) + (flashcardProficiency * FLASHCARD_WEIGHT);
        source = 'both';
    } else if (quizAccuracy !== null) {
        masteryScore = quizAccuracy;
        source = 'quiz';
    } else if (flashcardProficiency !== null) {
        masteryScore = flashcardProficiency;
        source = 'flashcard';
    }

    return {
        hasActivity: masteryScore !== null,
        masteryScore: masteryScore !== null ? Math.round(masteryScore) : 0,
        source,
        lastReviewedAt
    };
};

// Convert a topic title into a URL/DB-safe slug, e.g. "Cell Structure" -> "cell-structure"
const slugify = (title) => {
    return title
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'topic';
};

// Turn Gemini's nested topics/subtopics into a flat list of unique { topicId, title, difficulty }
const flattenTopics = (topics) => {
    const flat = [];
    const seenSlugs = new Map();

    const addTopic = (title, difficulty) => {
        const baseSlug = slugify(title);
        const count = seenSlugs.get(baseSlug) || 0;
        seenSlugs.set(baseSlug, count + 1);
        const topicId = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;

        flat.push({ topicId, title, difficulty });
    };

    for (const topic of topics) {
        addTopic(topic.title, topic.difficulty);

        for (const subtopic of topic.subtopics || []) {
            addTopic(subtopic.title, subtopic.difficulty);
        }
    }

    return flat;
};

// @desc    Generate a learning path (topic breakdown) for a document
// @route   POST /api/learning-path/generate
// @access  Private
export const generateLearningPath = async (req, res, next) => {
    try {
        const { documentId } = req.body;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: 'Please provide documentId',
                statusCode: 400
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id,
            status: 'ready'
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found or not ready',
                statusCode: 404
            });
        }

        // Extract topics/subtopics using Gemini
        const rawTopics = await geminiService.generateTopics(document.extractedText);
        const flatTopics = flattenTopics(rawTopics);

        if (flatTopics.length === 0) {
            return res.status(422).json({
                success: false,
                error: 'Could not extract any topics from this document',
                statusCode: 422
            });
        }

        let learningPath = await LearningPath.findOne({
            userId: req.user._id,
            documentId: document._id
        });

        if (learningPath) {
            // Merge: keep existing topic progress, add any newly discovered topics
            const existingTopicIds = new Set(learningPath.topics.map(t => t.topicId));
            const newTopics = flatTopics.filter(t => !existingTopicIds.has(t.topicId));

            newTopics.forEach(topic => {
                learningPath.topics.push({
                    topicId: topic.topicId,
                    title: topic.title,
                    difficulty: topic.difficulty,
                    status: 'not-started',
                    masteryScore: 0,
                    lastReviewedAt: null,
                    source: null
                });
            });

            await learningPath.save();
        } else {
            learningPath = await LearningPath.create({
                userId: req.user._id,
                documentId: document._id,
                topics: flatTopics.map(topic => ({
                    topicId: topic.topicId,
                    title: topic.title,
                    difficulty: topic.difficulty,
                    status: 'not-started',
                    masteryScore: 0,
                    lastReviewedAt: null,
                    source: null
                })),
                recommendedNext: []
            });
        }

        res.status(201).json({
            success: true,
            data: learningPath,
            message: 'Learning path generated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Recalculate topic mastery scores after a quiz or flashcard session
// @route   POST /api/learning-path/update
// @access  Private
export const updateLearningPath = async (req, res, next) => {
    try {
        const { documentId } = req.body;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: 'Please provide documentId',
                statusCode: 400
            });
        }

        const learningPath = await LearningPath.findOne({
            userId: req.user._id,
            documentId
        });

        if (!learningPath) {
            return res.status(404).json({
                success: false,
                error: 'Learning path not found. Generate one first.',
                statusCode: 404
            });
        }

        const [quizzes, flashcardSets] = await Promise.all([
            Quiz.find({ userId: req.user._id, documentId, completedAt: { $ne: null } }),
            Flashcard.find({ userId: req.user._id, documentId })
        ]);

        learningPath.topics.forEach(topic => {
            const stats = computeTopicStats(topic.topicId, quizzes, flashcardSets);

            topic.masteryScore = stats.masteryScore;
            topic.source = stats.source;
            topic.lastReviewedAt = stats.lastReviewedAt;
            topic.status = deriveStatus(stats.masteryScore, stats.hasActivity);
        });

        // Recommend the weakest, not-yet-mastered topics
        learningPath.recommendedNext = learningPath.topics
            .filter(topic => topic.status !== 'mastered')
            .sort((a, b) => a.masteryScore - b.masteryScore)
            .slice(0, RECOMMEND_LIMIT)
            .map(topic => ({
                topicId: topic.topicId,
                title: topic.title,
                masteryScore: topic.masteryScore,
                reason: topic.status === 'not-started'
                    ? 'Not started yet'
                    : `Lowest mastery (${topic.masteryScore}%)`
            }));

        await learningPath.save();

        res.status(200).json({
            success: true,
            data: learningPath,
            message: 'Learning path updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a user's learning path(s) and recommended next topics.
//          Pass ?documentId= to get a single document's path, otherwise
//          returns all learning paths for the user.
// @route   GET /api/learning-path/:userId
// @access  Private
export const getLearningPath = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { documentId } = req.query;

        if (userId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to view this learning path',
                statusCode: 403
            });
        }

        const query = { userId };
        if (documentId) query.documentId = documentId;

        const learningPaths = await LearningPath.find(query)
            .populate('documentId', 'title fileName')
            .sort({ updatedAt: -1 });

        if (documentId) {
            return res.status(200).json({
                success: true,
                data: learningPaths[0] || null
            });
        }

        res.status(200).json({
            success: true,
            count: learningPaths.length,
            data: learningPaths
        });
    } catch (error) {
        next(error);
    }
};