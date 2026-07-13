import Document from '../models/Document.js';
import LearningPath from '../models/LearningPath.js';
import * as geminiService from '../utils/geminiService.js';

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