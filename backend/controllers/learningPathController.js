import Document from '../models/Document.js';
import LearningPath from '../models/LearningPath.js';
import Quiz from '../models/Quiz.js';
import Flashcard from '../models/Flashcard.js';
import * as aiService from '../utils/ai/index.js';

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

// Eligibility gate for Weak Areas: needs enough completed quizzes for concept-level
// clustering (mined from wrong answers) to be meaningful, not just a cold-start guess
const REQUIRED_COMPLETED_QUIZZES = 3;

// Cap how many wrong-answer records are sent to Claude for weak-concept clustering
const MAX_WRONG_ANSWERS_FOR_ANALYSIS = 40;

// Deterministic fallback bands, used only when Claude's classification is missing/invalid
// for a topic - keeps knowledgeLevel consistent with the same bands Claude is grounded on
const KNOWLEDGE_PROFICIENT_THRESHOLD = 75;
const KNOWLEDGE_INTERMEDIATE_THRESHOLD = 40;

const deriveKnowledgeLevelFallback = (masteryScore) => {
    if (masteryScore >= KNOWLEDGE_PROFICIENT_THRESHOLD) return 'proficient';
    if (masteryScore >= KNOWLEDGE_INTERMEDIATE_THRESHOLD) return 'intermediate';
    return 'beginner';
};

// Deterministic fallback action, used only when Claude's action is missing/invalid for a topic
const deriveFallbackAction = (topic) => {
    if (!topic.source) return 'reread-summary';
    if (topic.knowledgeLevel === 'beginner') return 'ask-ai-explain';
    if (topic.source === 'quiz') return 'redo-flashcards';
    return 'retake-quiz';
};

const FALLBACK_ACTION_REASONS = {
    'reread-summary': "You haven't engaged with this topic yet - start with the document summary.",
    'ask-ai-explain': 'Your mastery score is still low - ask the AI to explain this concept again.',
    'redo-flashcards': "You haven't practiced this topic with flashcards yet.",
    'retake-quiz': 'A bit more quiz practice will help solidify this topic.'
};

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

// Gather every incorrectly-answered quiz question across the user's completed quizzes for a
// document, resolving each to the info Claude needs to cluster them into weak concepts.
// Most recent first, deduplicated (question + selected answer) so repeated retakes of the
// same quiz don't flood the prompt, and capped to keep token usage bounded.
const collectWrongAnswers = (quizzes) => {
    const wrongAnswers = [];
    const seen = new Set();

    for (const quiz of quizzes) {
        quiz.userAnswers.forEach(userAnswer => {
            if (userAnswer.isCorrect) return;

            const question = quiz.questions[userAnswer.questionIndex];
            if (!question) return;

            const dedupeKey = `${question.question}::${userAnswer.selectedAnswer}`;
            if (seen.has(dedupeKey)) return;
            seen.add(dedupeKey);

            wrongAnswers.push({
                question: question.question,
                correctAnswer: question.options[question.correctOption - 1] || '',
                selectedAnswer: userAnswer.selectedAnswer,
                explanation: question.explanation,
                topicTitle: question.topicTitle,
                answeredAt: userAnswer.answeredAt || quiz.completedAt
            });
        });
    }

    wrongAnswers.sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt));
    return wrongAnswers.slice(0, MAX_WRONG_ANSWERS_FOR_ANALYSIS);
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

// Turn Claude's nested topics/subtopics into a flat list of unique { topicId, title, difficulty }
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

        // Extract topics/subtopics using Claude
        const rawTopics = await aiService.generateTopics(document.extractedText);
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

// Recalculate every topic's mastery score + recommendedNext for a user's learning path
// on a given document. Returns null (no-op) if the user hasn't generated a learning
// path for that document yet - this lets callers use it as a safe, best-effort hook.
export const recalculateMastery = async (userId, documentId) => {
    const learningPath = await LearningPath.findOne({ userId, documentId });

    if (!learningPath) return null;

    const [quizzes, flashcardSets] = await Promise.all([
        Quiz.find({ userId, documentId, completedAt: { $ne: null } }),
        Flashcard.find({ userId, documentId })
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
    return learningPath;
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

        const learningPath = await recalculateMastery(req.user._id, documentId);

        if (!learningPath) {
            return res.status(404).json({
                success: false,
                error: 'Learning path not found. Generate one first.',
                statusCode: 404
            });
        }

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

// How much real activity the user has on this document. Used both to decide whether the
// study plan can be upgraded from its deterministic default to an AI classification, and
// whether Weak Areas (which needs enough wrong answers to cluster meaningfully) unlocks.
const computeActivityStats = async (userId, documentId) => {
    const [completedQuizCount, flashcardSets] = await Promise.all([
        Quiz.countDocuments({ userId, documentId, completedAt: { $ne: null } }),
        Flashcard.find({ userId, documentId })
    ]);

    const totalFlashcardReviews = flashcardSets.reduce(
        (sum, set) => sum + set.cards.reduce((cardSum, card) => cardSum + card.reviewCount, 0),
        0
    );

    return {
        completedQuizCount,
        totalFlashcardReviews,
        weakAreasEligibility: {
            eligible: completedQuizCount >= REQUIRED_COMPLETED_QUIZZES,
            completedQuizCount,
            requiredQuizCount: REQUIRED_COMPLETED_QUIZZES
        }
    };
};

// @desc    Lightweight Weak Areas eligibility check (completed quiz count vs the 3-quiz
//          threshold) for a document. No learning path required and no Claude calls -
//          used to power "Go to Learning Path" prompts elsewhere (e.g. quiz results page)
//          without triggering study-plan regeneration.
// @route   GET /api/learning-path/weak-areas-status/:documentId
// @access  Private
export const getWeakAreasStatus = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        const { weakAreasEligibility } = await computeActivityStats(req.user._id, documentId);

        res.status(200).json({
            success: true,
            data: weakAreasEligibility
        });
    } catch (error) {
        next(error);
    }
};

// Regenerate the studyPlan checklist (always) + concept-level weakConcepts (once Weak Areas
// is eligible). The study plan starts as a deterministic, no-AI-call default built from topic
// state, and upgrades to Claude's classification once the user has any real quiz/flashcard
// activity. Only recomputes when real activity changed since the plan was last generated (or
// `force` is set) - keeps this cheap to call on every Learning Path page load.
const generateStudyPlanForDocument = async (userId, documentId, { force = false } = {}) => {
    const learningPath = await LearningPath.findOne({ userId, documentId });
    if (!learningPath) return null;

    const activityStats = await computeActivityStats(userId, documentId);
    const { weakAreasEligibility } = activityStats;
    const hasAnyActivity = learningPath.topics.some(topic => topic.source);

    // Evidence for the Weak Areas section - independent of staleness, cheap enough to run
    // on every load once eligible (only real quiz activity flips eligibility at all).
    const recentQuizResults = weakAreasEligibility.eligible
        ? (await Quiz.find({ userId, documentId, completedAt: { $ne: null } })
            .select('title score totalQuestions completedAt')
            .sort({ completedAt: -1 }))
            .map(quiz => ({
                quizId: quiz._id,
                title: quiz.title,
                score: quiz.score,
                totalQuestions: quiz.totalQuestions,
                completedAt: quiz.completedAt
            }))
        : [];

    const isStale = force
        || !learningPath.studyPlanGeneratedAt
        || learningPath.studyPlanStats?.completedQuizCount !== activityStats.completedQuizCount
        || learningPath.studyPlanStats?.totalFlashcardReviews !== activityStats.totalFlashcardReviews;

    if (!isStale) {
        return { learningPath, weakAreasEligibility, recentQuizResults };
    }

    const now = Date.now();
    const topicStatsInput = learningPath.topics.map(topic => ({
        title: topic.title,
        masteryScore: topic.masteryScore,
        status: topic.status,
        difficulty: topic.difficulty,
        source: topic.source,
        daysSinceReviewed: topic.lastReviewedAt
            ? Math.floor((now - new Date(topic.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24))
            : null
    }));

    // Only spend a Claude call once there's real quiz/flashcard activity to classify - before
    // that, every topic is untouched and the deterministic fallback below is just as accurate.
    // Best-effort: if Claude fails entirely, fall back to deterministic classification
    // for every topic rather than blocking the whole feature.
    let classifications = [];
    if (hasAnyActivity) {
        try {
            classifications = await aiService.classifyTopicKnowledge(topicStatsInput);
        } catch (error) {
            console.error('Failed to classify topic knowledge via Claude, using fallback:', error);
        }
    }

    const classificationByTitle = new Map(
        classifications.map(c => [c.title.toLowerCase(), c])
    );

    learningPath.topics.forEach(topic => {
        const classification = classificationByTitle.get(topic.title.toLowerCase());

        topic.knowledgeLevel = classification?.knowledgeLevel || deriveKnowledgeLevelFallback(topic.masteryScore);
        topic.knowledgeLevelReason = classification?.levelReason
            || `Based on a mastery score of ${topic.masteryScore}%.`;
    });

    // Ordered checklist: weakest topics first, excluding anything already proficient
    learningPath.studyPlan = learningPath.topics
        .filter(topic => topic.knowledgeLevel !== 'proficient')
        .sort((a, b) => a.masteryScore - b.masteryScore)
        .map(topic => {
            const classification = classificationByTitle.get(topic.title.toLowerCase());
            const action = classification?.action || deriveFallbackAction(topic);
            const reason = classification?.actionReason || FALLBACK_ACTION_REASONS[action];

            return {
                topicId: topic.topicId,
                title: topic.title,
                knowledgeLevel: topic.knowledgeLevel,
                action,
                reason
            };
        });

    // Concept-level weak areas, mined from the user's actual wrong quiz answers (flashcards
    // carry no correctness signal, so only quizzes can drive this) - gated on Weak Areas
    // eligibility (3+ completed quizzes) so clustering has enough signal to be meaningful.
    // Best-effort: if Claude fails, keep whatever weakConcepts were already stored rather
    // than blocking the response.
    if (!weakAreasEligibility.eligible) {
        learningPath.weakConcepts = [];
    } else {
        const completedQuizzes = await Quiz.find({ userId, documentId, completedAt: { $ne: null } });
        const wrongAnswers = collectWrongAnswers(completedQuizzes);

        if (wrongAnswers.length === 0) {
            learningPath.weakConcepts = [];
        } else {
            try {
                const concepts = await aiService.identifyWeakConcepts(wrongAnswers);
                const topicIdByTitle = new Map(
                    learningPath.topics.map(t => [t.title.toLowerCase(), t.topicId])
                );

                learningPath.weakConcepts = concepts
                    .filter(c => c.action) // drop entries Claude gave no valid action for
                    .map(c => ({
                        concept: c.concept,
                        description: c.description,
                        relatedTopicId: c.relatedTopicTitle
                            ? topicIdByTitle.get(c.relatedTopicTitle.toLowerCase()) || null
                            : null,
                        relatedTopicTitle: c.relatedTopicTitle,
                        missedCount: c.missedCount,
                        action: c.action,
                        reason: c.actionReason
                    }));
            } catch (error) {
                console.error('Failed to identify weak concepts via Claude, keeping previous value:', error);
            }
        }
    }

    learningPath.studyPlanGeneratedAt = new Date();
    learningPath.studyPlanStats = {
        completedQuizCount: activityStats.completedQuizCount,
        totalFlashcardReviews: activityStats.totalFlashcardReviews
    };

    // Two Claude calls happen between reading and saving this document, which widens the
    // window for a concurrent request (e.g. duplicate calls on page load) to save first and
    // trigger a Mongoose VersionError. Reapply our already-computed fields onto a fresh copy
    // rather than re-running (and re-billing) the Claude calls.
    let savedLearningPath = learningPath;
    try {
        await learningPath.save();
    } catch (error) {
        if (error.name !== 'VersionError') throw error;

        const fresh = await LearningPath.findById(learningPath._id);
        if (!fresh) throw error;

        fresh.topics = learningPath.topics;
        fresh.studyPlan = learningPath.studyPlan;
        fresh.weakConcepts = learningPath.weakConcepts;
        fresh.studyPlanGeneratedAt = learningPath.studyPlanGeneratedAt;
        fresh.studyPlanStats = learningPath.studyPlanStats;
        await fresh.save();
        savedLearningPath = fresh;
    }

    return { learningPath: savedLearningPath, weakAreasEligibility, recentQuizResults };
};

// @desc    Get (regenerating if stale) the study plan checklist for a document, plus Weak
//          Areas evidence once eligible. The study plan itself is always returned (starting
//          as a deterministic default, upgrading to AI classification with real activity);
//          only Weak Areas is gated behind enough completed quizzes.
// @route   POST /api/learning-path/study-plan
// @access  Private
export const getStudyPlan = async (req, res, next) => {
    try {
        const { documentId, force } = req.body;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: 'Please provide documentId',
                statusCode: 400
            });
        }

        const result = await generateStudyPlanForDocument(req.user._id, documentId, { force: !!force });

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Learning path not found. Generate one first.',
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            data: result.learningPath,
            weakAreasEligibility: result.weakAreasEligibility,
            recentQuizResults: result.recentQuizResults,
            message: result.weakAreasEligibility.eligible
                ? 'Study plan is up to date'
                : 'Complete more quizzes to unlock Weak Areas'
        });
    } catch (error) {
        next(error);
    }
};