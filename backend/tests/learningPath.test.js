import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    generateLearningPath,
    getLearningPath,
    __testHelpers
} from '../controllers/learningPathController.js';
import Document from '../models/Document.js';
import LearningPath from '../models/LearningPath.js';
import * as claudeService from '../utils/claudeService.js';

const {
    slugify,
    flattenTopics,
    deriveStatus,
    deriveKnowledgeLevelFallback,
    deriveFallbackAction,
    computeSkillCategoryStats
} = __testHelpers;

// Mock Mongoose models and AI service
vi.mock('../models/Document.js', () => ({
    default: {
        findOne: vi.fn()
    }
}));

vi.mock('../models/LearningPath.js', () => ({
    default: {
        findOne: vi.fn(),
        create: vi.fn(),
        find: vi.fn()
    }
}));

vi.mock('../utils/claudeService.js', () => ({
    generateTopics: vi.fn()
}));

describe('Learning Path Feature - Unit & Algorithm Tests', () => {
    describe('slugify', () => {
        it('should convert topic titles into URL/DB-safe slugs', () => {
            expect(slugify('Data Structures & Algorithms')).toBe('data-structures-algorithms');
            expect(slugify('React Hooks (useState, useEffect)')).toBe('react-hooks-usestate-useeffect');
            expect(slugify('   Async / Await   ')).toBe('async-await');
            expect(slugify('')).toBe('topic');
        });
    });

    describe('flattenTopics', () => {
        it('should flatten nested topics and subtopics into a single array with unique slugs', () => {
            const nestedTopics = [
                {
                    title: 'Binary Trees',
                    difficulty: 'medium',
                    subtopics: [
                        { title: 'Tree Traversal', difficulty: 'easy' },
                        { title: 'Binary Search Tree', difficulty: 'medium' }
                    ]
                },
                {
                    title: 'Binary Trees', // duplicate title
                    difficulty: 'hard',
                    subtopics: []
                }
            ];

            const result = flattenTopics(nestedTopics);

            expect(result).toHaveLength(4);
            expect(result[0]).toEqual({
                topicId: 'binary-trees',
                title: 'Binary Trees',
                difficulty: 'medium'
            });
            expect(result[1]).toEqual({
                topicId: 'tree-traversal',
                title: 'Tree Traversal',
                difficulty: 'easy'
            });
            expect(result[2]).toEqual({
                topicId: 'binary-search-tree',
                title: 'Binary Search Tree',
                difficulty: 'medium'
            });
            // Duplicate slug gets incremented suffix
            expect(result[3]).toEqual({
                topicId: 'binary-trees-2',
                title: 'Binary Trees',
                difficulty: 'hard'
            });
        });
    });

    describe('deriveStatus', () => {
        it('should return "not-started" when user has no activity', () => {
            expect(deriveStatus(0, false)).toBe('not-started');
            expect(deriveStatus(90, false)).toBe('not-started');
        });

        it('should return "mastered" for score >= 85 with activity', () => {
            expect(deriveStatus(85, true)).toBe('mastered');
            expect(deriveStatus(100, true)).toBe('mastered');
        });

        it('should return "in-progress" for score between 50 and 84 with activity', () => {
            expect(deriveStatus(50, true)).toBe('in-progress');
            expect(deriveStatus(84, true)).toBe('in-progress');
        });

        it('should return "weak" for score < 50 with activity', () => {
            expect(deriveStatus(49, true)).toBe('weak');
            expect(deriveStatus(10, true)).toBe('weak');
            expect(deriveStatus(0, true)).toBe('weak');
        });
    });

    describe('deriveKnowledgeLevelFallback', () => {
        it('should classify score >= 75 as proficient', () => {
            expect(deriveKnowledgeLevelFallback(75)).toBe('proficient');
            expect(deriveKnowledgeLevelFallback(95)).toBe('proficient');
        });

        it('should classify score between 40 and 74 as intermediate', () => {
            expect(deriveKnowledgeLevelFallback(40)).toBe('intermediate');
            expect(deriveKnowledgeLevelFallback(74)).toBe('intermediate');
        });

        it('should classify score < 40 as beginner', () => {
            expect(deriveKnowledgeLevelFallback(39)).toBe('beginner');
            expect(deriveKnowledgeLevelFallback(0)).toBe('beginner');
        });
    });

    describe('deriveFallbackAction', () => {
        it('should recommend "reread-summary" if topic has no engagement source', () => {
            expect(deriveFallbackAction({ source: null })).toBe('reread-summary');
        });

        it('should recommend "ask-ai-explain" if user is at beginner level', () => {
            expect(deriveFallbackAction({ source: 'quiz', knowledgeLevel: 'beginner' })).toBe('ask-ai-explain');
        });

        it('should recommend "redo-flashcards" if source was quiz and level > beginner', () => {
            expect(deriveFallbackAction({ source: 'quiz', knowledgeLevel: 'intermediate' })).toBe('redo-flashcards');
        });

        it('should recommend "retake-quiz" if source was flashcard', () => {
            expect(deriveFallbackAction({ source: 'flashcard', knowledgeLevel: 'intermediate' })).toBe('retake-quiz');
        });
    });

    describe('computeSkillCategoryStats', () => {
        it('should calculate cognitive skill category accuracy and detect insufficient data', () => {
            const mockQuizzes = [
                {
                    questions: [
                        { skillCategory: 'conceptual' },
                        { skillCategory: 'conceptual' },
                        { skillCategory: 'conceptual' },
                        { skillCategory: 'logical' }
                    ],
                    userAnswers: [
                        { questionIndex: 0, isCorrect: true },
                        { questionIndex: 1, isCorrect: true },
                        { questionIndex: 2, isCorrect: false },
                        { questionIndex: 3, isCorrect: true } // only 1 attempt for logical
                    ]
                }
            ];

            const stats = computeSkillCategoryStats(mockQuizzes);

            // Conceptual has 3 attempts (2 correct, 1 wrong) -> 67% accuracy -> 'in-progress'
            const conceptual = stats.find(s => s.skillCategory === 'conceptual');
            expect(conceptual).toBeDefined();
            expect(conceptual.totalAnswered).toBe(3);
            expect(conceptual.correctCount).toBe(2);
            expect(conceptual.accuracy).toBe(67);
            expect(conceptual.status).toBe('in-progress');

            // Logical has only 1 attempt -> status must be 'insufficient-data'
            const logical = stats.find(s => s.skillCategory === 'logical');
            expect(logical).toBeDefined();
            expect(logical.totalAnswered).toBe(1);
            expect(logical.status).toBe('insufficient-data');
        });
    });
});

describe('Learning Path Controller - generateLearningPath', () => {
    let req, res, next;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            user: { _id: 'user123' },
            body: { documentId: 'doc123' }
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        next = vi.fn();
    });

    it('should return 400 if documentId is missing', async () => {
        req.body = {};

        await generateLearningPath(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'Please provide documentId',
            statusCode: 400
        }));
    });

    it('should return 404 if document does not exist or is not ready', async () => {
        Document.findOne.mockResolvedValue(null);

        await generateLearningPath(req, res, next);

        expect(Document.findOne).toHaveBeenCalledWith({
            _id: 'doc123',
            userId: 'user123',
            status: 'ready'
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'Document not found or not ready',
            statusCode: 404
        }));
    });

    it('should return 422 if AI topic extraction yields no topics', async () => {
        Document.findOne.mockResolvedValue({
            _id: 'doc123',
            userId: 'user123',
            extractedText: 'Short text without topics'
        });
        claudeService.generateTopics.mockResolvedValue([]);

        await generateLearningPath(req, res, next);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'Could not extract any topics from this document',
            statusCode: 422
        }));
    });

    it('should successfully create a new learning path when none exists', async () => {
        const mockDocument = {
            _id: 'doc123',
            userId: 'user123',
            extractedText: 'Full document text about Machine Learning'
        };

        const mockExtractedTopics = [
            {
                title: 'Supervised Learning',
                difficulty: 'beginner',
                subtopics: [{ title: 'Linear Regression', difficulty: 'beginner' }]
            }
        ];

        const mockCreatedLearningPath = {
            _id: 'path123',
            userId: 'user123',
            documentId: 'doc123',
            topics: [
                {
                    topicId: 'supervised-learning',
                    title: 'Supervised Learning',
                    difficulty: 'beginner',
                    status: 'not-started',
                    masteryScore: 0
                },
                {
                    topicId: 'linear-regression',
                    title: 'Linear Regression',
                    difficulty: 'beginner',
                    status: 'not-started',
                    masteryScore: 0
                }
            ]
        };

        Document.findOne.mockResolvedValue(mockDocument);
        claudeService.generateTopics.mockResolvedValue(mockExtractedTopics);
        LearningPath.findOne.mockResolvedValue(null);
        LearningPath.create.mockResolvedValue(mockCreatedLearningPath);

        await generateLearningPath(req, res, next);

        expect(LearningPath.create).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user123',
            documentId: 'doc123',
            topics: expect.arrayContaining([
                expect.objectContaining({
                    topicId: 'supervised-learning',
                    title: 'Supervised Learning',
                    status: 'not-started',
                    masteryScore: 0
                }),
                expect.objectContaining({
                    topicId: 'linear-regression',
                    title: 'Linear Regression',
                    status: 'not-started',
                    masteryScore: 0
                })
            ])
        }));

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockCreatedLearningPath,
            message: 'Learning path generated successfully'
        });
    });

    it('should merge new topics into an existing learning path without wiping progress', async () => {
        const mockDocument = {
            _id: 'doc123',
            userId: 'user123',
            extractedText: 'Text with updated chapters'
        };

        const existingLearningPath = {
            _id: 'path123',
            userId: 'user123',
            documentId: 'doc123',
            topics: [
                {
                    topicId: 'supervised-learning',
                    title: 'Supervised Learning',
                    status: 'mastered',
                    masteryScore: 92
                }
            ],
            save: vi.fn().mockResolvedValue(true)
        };

        const newTopicsFromAI = [
            { title: 'Supervised Learning', difficulty: 'beginner' }, // already exists
            { title: 'Unsupervised Learning', difficulty: 'intermediate' } // brand new
        ];

        Document.findOne.mockResolvedValue(mockDocument);
        claudeService.generateTopics.mockResolvedValue(newTopicsFromAI);
        LearningPath.findOne.mockResolvedValue(existingLearningPath);

        await generateLearningPath(req, res, next);

        // Existing topic kept its score of 92 and mastered status
        expect(existingLearningPath.topics[0].masteryScore).toBe(92);
        expect(existingLearningPath.topics[0].status).toBe('mastered');

        // New topic was added
        expect(existingLearningPath.topics).toHaveLength(2);
        expect(existingLearningPath.topics[1]).toEqual(expect.objectContaining({
            topicId: 'unsupervised-learning',
            title: 'Unsupervised Learning',
            status: 'not-started',
            masteryScore: 0
        }));

        expect(existingLearningPath.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });
});

describe('Learning Path Controller - getLearningPath', () => {
    let req, res, next;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            user: { _id: { toString: () => 'user123' } },
            params: { userId: 'user123' },
            query: {}
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        next = vi.fn();
    });

    it('should return 403 if requested userId does not match authenticated user', async () => {
        req.user = { _id: { toString: () => 'otherUser' } };

        await getLearningPath(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'Not authorized to view this learning path',
            statusCode: 403
        }));
    });

    it('should return 200 with list of learning paths for the user', async () => {
        const mockLearningPath = {
            _id: 'path123',
            userId: 'user123',
            documentId: { _id: 'doc123', title: 'Calculus Notes' },
            topics: [{ topicId: 'limits', title: 'Limits', status: 'in-progress', masteryScore: 65 }]
        };

        const mockSort = vi.fn().mockResolvedValue([mockLearningPath]);
        const mockPopulate = vi.fn().mockReturnValue({ sort: mockSort });
        LearningPath.find.mockReturnValue({ populate: mockPopulate });

        await getLearningPath(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            count: 1,
            data: [mockLearningPath]
        });
    });

    it('should return 200 with single document path when documentId query param is provided', async () => {
        req.query = { documentId: 'doc123' };

        const mockLearningPath = {
            _id: 'path123',
            userId: 'user123',
            documentId: { _id: 'doc123', title: 'Calculus Notes' },
            topics: [{ topicId: 'limits', title: 'Limits', status: 'in-progress', masteryScore: 65 }]
        };

        const mockSort = vi.fn().mockResolvedValue([mockLearningPath]);
        const mockPopulate = vi.fn().mockReturnValue({ sort: mockSort });
        LearningPath.find.mockReturnValue({ populate: mockPopulate });

        await getLearningPath(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: mockLearningPath
        });
    });
});
