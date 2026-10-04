import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboard } from '../controllers/progressController.js';
import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import LearningPath from '../models/LearningPath.js';

// Mock models
vi.mock('../models/Document.js', () => ({
    default: {
        countDocuments: vi.fn(),
        find: vi.fn()
    }
}));

vi.mock('../models/Flashcard.js', () => ({
    default: {
        countDocuments: vi.fn(),
        find: vi.fn()
    }
}));

vi.mock('../models/Quiz.js', () => ({
    default: {
        countDocuments: vi.fn(),
        find: vi.fn()
    }
}));

vi.mock('../models/LearningPath.js', () => ({
    default: {
        find: vi.fn()
    }
}));

describe('Progress & Analytics Feature - Controller Unit Tests (progressController.js)', () => {
    let req, res, next;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            user: { _id: 'user_analytics_123' }
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        next = vi.fn();
    });

    it('should return initial zeroed metrics for a new user with no activity', async () => {
        // Document mocks
        Document.countDocuments.mockResolvedValue(0);
        Document.find.mockReturnValue({
            sort: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                    select: vi.fn().mockResolvedValue([])
                })
            }),
            select: vi.fn().mockResolvedValue([])
        });

        // Flashcard mocks
        Flashcard.countDocuments.mockResolvedValue(0);
        Flashcard.find.mockResolvedValue([]);

        // Quiz mocks
        Quiz.countDocuments.mockResolvedValue(0);
        Quiz.find.mockImplementation((query) => {
            if (query && query.completedAt && query.completedAt.$gte) {
                return { select: vi.fn().mockResolvedValue([]) };
            }
            if (query && query.completedAt) {
                // completed quizzes for averageScore calculation
                return Promise.resolve([]);
            }
            // recent quizzes query with sort/limit/populate
            return {
                sort: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                        populate: vi.fn().mockReturnValue({
                            select: vi.fn().mockResolvedValue([])
                        })
                    })
                })
            };
        });

        // LearningPath mocks
        LearningPath.find.mockReturnValue({
            populate: vi.fn().mockResolvedValue([])
        });

        await getDashboard(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                overview: {
                    totalDocuments: 0,
                    totalFlashcardSets: 0,
                    totalFlashcards: 0,
                    reviewedFlashcards: 0,
                    starredFlashcards: 0,
                    totalQuizzes: 0,
                    completedQuizzes: 0,
                    averageScore: 0,
                    overallMastery: null,
                    topicsTracked: 0,
                    studyStreak: 0
                },
                weeklyActivity: expect.arrayContaining([
                    expect.objectContaining({ count: 0 })
                ]),
                focusAreas: [],
                recentActivity: {
                    documents: [],
                    quizzes: []
                }
            })
        }));
    });

    it('should accurately aggregate document, flashcard, and quiz statistics', async () => {
        // Counts
        Document.countDocuments.mockResolvedValue(4);
        Flashcard.countDocuments.mockResolvedValue(2);
        Quiz.countDocuments.mockImplementation((filter) => {
            if (filter.completedAt) return Promise.resolve(3);
            return Promise.resolve(5); // total quizzes
        });

        // Flashcards with reviewCount and isStarred
        const mockFlashcardSets = [
            {
                cards: [
                    { reviewCount: 3, isStarred: true, lastReviewed: new Date() },
                    { reviewCount: 0, isStarred: false, lastReviewed: null }
                ]
            },
            {
                cards: [
                    { reviewCount: 1, isStarred: true, lastReviewed: new Date() }
                ]
            }
        ];
        Flashcard.find.mockResolvedValue(mockFlashcardSets);

        // Completed quizzes for average calculation: [80, 90, 70] -> avg = 80
        const mockCompletedQuizzes = [
            { score: 80, completedAt: new Date() },
            { score: 90, completedAt: new Date() },
            { score: 70, completedAt: new Date() }
        ];

        // Recent activity
        const mockRecentDocs = [{ title: 'Doc 1' }];
        const mockRecentQuizzes = [{ title: 'Quiz 1' }];

        Document.find.mockImplementation((query) => {
            if (query && query.lastAccessed && query.lastAccessed.$gte) {
                return { select: vi.fn().mockResolvedValue([]) };
            }
            return {
                sort: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                        select: vi.fn().mockResolvedValue(mockRecentDocs)
                    })
                })
            };
        });

        Quiz.find.mockImplementation((query) => {
            if (query && query.completedAt && query.completedAt.$gte) {
                return { select: vi.fn().mockResolvedValue([]) };
            }
            if (query && query.completedAt) {
                return Promise.resolve(mockCompletedQuizzes);
            }
            return {
                sort: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                        populate: vi.fn().mockReturnValue({
                            select: vi.fn().mockResolvedValue(mockRecentQuizzes)
                        })
                    })
                })
            };
        });

        LearningPath.find.mockReturnValue({
            populate: vi.fn().mockResolvedValue([])
        });

        await getDashboard(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0].data;

        expect(responseData.overview.totalDocuments).toBe(4);
        expect(responseData.overview.totalFlashcardSets).toBe(2);
        expect(responseData.overview.totalFlashcards).toBe(3);
        expect(responseData.overview.reviewedFlashcards).toBe(2);
        expect(responseData.overview.starredFlashcards).toBe(2);
        expect(responseData.overview.totalQuizzes).toBe(5);
        expect(responseData.overview.completedQuizzes).toBe(3);
        expect(responseData.overview.averageScore).toBe(80);
    });

    it('should calculate consecutive study streak and weekly activity breakdown', async () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        Document.countDocuments.mockResolvedValue(1);
        Flashcard.countDocuments.mockResolvedValue(0);
        Flashcard.find.mockResolvedValue([]);
        Quiz.countDocuments.mockResolvedValue(1);

        Document.find.mockImplementation((query) => {
            if (query && query.lastAccessed && query.lastAccessed.$gte) {
                return { select: vi.fn().mockResolvedValue([{ lastAccessed: today }]) };
            }
            return {
                sort: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                        select: vi.fn().mockResolvedValue([])
                    })
                })
            };
        });

        Quiz.find.mockImplementation((query) => {
            if (query && query.completedAt && query.completedAt.$gte) {
                return { select: vi.fn().mockResolvedValue([{ completedAt: yesterday }]) };
            }
            if (query && query.completedAt) {
                return Promise.resolve([{ score: 100, completedAt: yesterday }]);
            }
            return {
                sort: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                        populate: vi.fn().mockReturnValue({
                            select: vi.fn().mockResolvedValue([])
                        })
                    })
                })
            };
        });

        LearningPath.find.mockReturnValue({
            populate: vi.fn().mockResolvedValue([])
        });

        await getDashboard(req, res, next);

        const responseData = res.json.mock.calls[0][0].data;

        // Today and Yesterday had activity -> streak is 2 days
        expect(responseData.overview.studyStreak).toBe(2);
        expect(responseData.weeklyActivity).toHaveLength(7);
    });

    it('should compute overall mastery and prioritize top 5 focus areas from learning paths', async () => {
        Document.countDocuments.mockResolvedValue(1);
        Flashcard.countDocuments.mockResolvedValue(0);
        Flashcard.find.mockResolvedValue([]);
        Quiz.countDocuments.mockResolvedValue(0);

        Document.find.mockImplementation(() => ({
            sort: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                    select: vi.fn().mockResolvedValue([])
                })
            }),
            select: vi.fn().mockResolvedValue([])
        }));

        Quiz.find.mockImplementation((query) => {
            if (query && query.completedAt && query.completedAt.$gte) {
                return { select: vi.fn().mockResolvedValue([]) };
            }
            if (query && query.completedAt) return Promise.resolve([]);
            return {
                sort: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                        populate: vi.fn().mockReturnValue({
                            select: vi.fn().mockResolvedValue([])
                        })
                    })
                })
            };
        });

        const mockLearningPaths = [
            {
                documentId: { _id: 'doc_1', title: 'Data Structures' },
                topics: [
                    { title: 'Linked Lists', masteryScore: 90 },
                    { title: 'Trees', masteryScore: 70 }
                ],
                weakConcepts: [
                    { concept: 'AVL Balance', missedCount: 5, action: 'retake-quiz', relatedTopicTitle: 'Trees' },
                    { concept: 'Pointers', missedCount: 2, action: 'reread-summary', relatedTopicTitle: 'Linked Lists' },
                    { concept: 'In-order traversal', missedCount: 8, action: 'redo-flashcards', relatedTopicTitle: 'Trees' },
                    { concept: 'Queue FIFO', missedCount: 1, action: 'retake-quiz', relatedTopicTitle: 'Queues' },
                    { concept: 'Graph Cycles', missedCount: 10, action: 'ask-ai-explain', relatedTopicTitle: 'Graphs' },
                    { concept: 'Hashing Collision', missedCount: 4, action: 'retake-quiz', relatedTopicTitle: 'Hash Tables' }
                ]
            }
        ];

        LearningPath.find.mockReturnValue({
            populate: vi.fn().mockResolvedValue(mockLearningPaths)
        });

        await getDashboard(req, res, next);

        const responseData = res.json.mock.calls[0][0].data;

        // Mastery: (90 + 70) / 2 = 80
        expect(responseData.overview.overallMastery).toBe(80);
        expect(responseData.overview.topicsTracked).toBe(2);

        // Focus areas: capped at 5 and sorted by missedCount descending (10, 8, 5, 4, 2)
        expect(responseData.focusAreas).toHaveLength(5);
        expect(responseData.focusAreas[0].concept).toBe('Graph Cycles');
        expect(responseData.focusAreas[0].missedCount).toBe(10);
        expect(responseData.focusAreas[1].concept).toBe('In-order traversal');
        expect(responseData.focusAreas[1].missedCount).toBe(8);
        expect(responseData.focusAreas[2].concept).toBe('AVL Balance');
        expect(responseData.focusAreas[2].missedCount).toBe(5);
    });

    it('should forward unexpected database errors to next()', async () => {
        const error = new Error('Database connection failed');
        Document.countDocuments.mockRejectedValue(error);

        await getDashboard(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
