import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getQuizzes,
    getQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuiz
} from '../controllers/quizController.js';
import Quiz from '../models/Quiz.js';
import { recalculateMastery } from '../controllers/learningPathController.js';

// Mock dependencies
vi.mock('../models/Quiz.js', () => ({
    default: {
        find: vi.fn(),
        findOne: vi.fn()
    }
}));

vi.mock('../controllers/learningPathController.js', () => ({
    recalculateMastery: vi.fn()
}));

describe('Quiz Feature - Controller Unit Tests (quizController.js)', () => {
    let req, res, next;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            user: { _id: 'user_123' },
            params: {},
            body: {}
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        next = vi.fn();
    });

    describe('getQuizzes', () => {
        it('should return 200 with list of quizzes for a document', async () => {
            req.params = { documentId: 'doc_456' };

            const mockQuizzes = [
                { _id: 'quiz_1', title: 'Calculus Basics', score: 80 },
                { _id: 'quiz_2', title: 'Derivatives', score: 100 }
            ];

            const mockSort = vi.fn().mockResolvedValue(mockQuizzes);
            const mockPopulate = vi.fn().mockReturnValue({ sort: mockSort });
            Quiz.find.mockReturnValue({ populate: mockPopulate });

            await getQuizzes(req, res, next);

            expect(Quiz.find).toHaveBeenCalledWith({
                userId: 'user_123',
                documentId: 'doc_456'
            });
            expect(mockPopulate).toHaveBeenCalledWith('documentId', 'title fileName');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                data: mockQuizzes
            });
        });

        it('should forward database errors to next()', async () => {
            req.params = { documentId: 'doc_456' };
            const error = new Error('Database query error');
            Quiz.find.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    sort: vi.fn().mockRejectedValue(error)
                })
            });

            await getQuizzes(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getQuizById', () => {
        it('should return 404 if quiz is not found for the user', async () => {
            req.params = { id: 'quiz_nonexistent' };
            Quiz.findOne.mockResolvedValue(null);

            await getQuizById(req, res, next);

            expect(Quiz.findOne).toHaveBeenCalledWith({
                _id: 'quiz_nonexistent',
                userId: 'user_123'
            });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Quiz not found',
                statusCode: 404
            }));
        });

        it('should return 200 with quiz data when found', async () => {
            req.params = { id: 'quiz_123' };
            const mockQuiz = {
                _id: 'quiz_123',
                title: 'Data Structures Quiz',
                totalQuestions: 5
            };

            Quiz.findOne.mockResolvedValue(mockQuiz);

            await getQuizById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockQuiz
            });
        });
    });

    describe('submitQuiz', () => {
        it('should return 400 if answers payload is not an array', async () => {
            req.params = { id: 'quiz_123' };
            req.body = { answers: 'invalid_answers_string' };

            await submitQuiz(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Please provide answers array',
                statusCode: 400
            }));
        });

        it('should return 404 if quiz does not exist', async () => {
            req.params = { id: 'quiz_missing' };
            req.body = { answers: [] };
            Quiz.findOne.mockResolvedValue(null);

            await submitQuiz(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Quiz not found'
            }));
        });

        it('should return 400 if quiz has already been completed', async () => {
            req.params = { id: 'quiz_123' };
            req.body = { answers: [] };
            Quiz.findOne.mockResolvedValue({
                _id: 'quiz_123',
                completedAt: new Date('2026-01-01')
            });

            await submitQuiz(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Quiz already completed',
                statusCode: 400
            }));
        });

        it('should grade answers accurately, calculate score percentage, and update mastery', async () => {
            req.params = { id: 'quiz_123' };
            req.body = {
                answers: [
                    { questionIndex: 0, selectedAnswer: 'Stack' },       // Correct (Stack is opt index 0 -> 1)
                    { questionIndex: 1, selectedAnswer: 'O(N^2)' }       // Wrong (Correct is O(1))
                ]
            };

            const mockQuiz = {
                _id: 'quiz_123',
                documentId: 'doc_999',
                totalQuestions: 2,
                completedAt: null,
                questions: [
                    {
                        question: 'Which LIFO data structure?',
                        options: ['Stack', 'Queue', 'Array', 'Tree'],
                        correctOption: 1
                    },
                    {
                        question: 'Time complexity of hash table lookup?',
                        options: ['O(1)', 'O(N)', 'O(N^2)', 'O(log N)'],
                        correctOption: 1
                    }
                ],
                userAnswers: [],
                score: 0,
                save: vi.fn().mockResolvedValue(true)
            };

            Quiz.findOne.mockResolvedValue(mockQuiz);
            recalculateMastery.mockResolvedValue({ _id: 'learning_path_abc' });

            await submitQuiz(req, res, next);

            // 1 out of 2 correct = 50%
            expect(mockQuiz.score).toBe(50);
            expect(mockQuiz.completedAt).toBeInstanceOf(Date);
            expect(mockQuiz.userAnswers).toHaveLength(2);
            expect(mockQuiz.userAnswers[0].isCorrect).toBe(true);
            expect(mockQuiz.userAnswers[1].isCorrect).toBe(false);
            expect(mockQuiz.save).toHaveBeenCalled();

            // Recalculates learning path mastery
            expect(recalculateMastery).toHaveBeenCalledWith('user_123', 'doc_999');

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    quizId: 'quiz_123',
                    score: 50,
                    correctCount: 1,
                    totalQuestions: 2,
                    percentage: 50
                }),
                masteryUpdated: true,
                message: 'Quiz submitted successfully'
            }));
        });

        it('should safely complete quiz submission even if recalculateMastery fails', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            req.params = { id: 'quiz_123' };
            req.body = { answers: [] };

            const mockQuiz = {
                _id: 'quiz_123',
                documentId: 'doc_999',
                totalQuestions: 1,
                completedAt: null,
                questions: [{ question: 'Q1', options: ['A'], correctOption: 1 }],
                save: vi.fn().mockResolvedValue(true)
            };

            Quiz.findOne.mockResolvedValue(mockQuiz);
            recalculateMastery.mockRejectedValue(new Error('Mastery calc failed'));

            await submitQuiz(req, res, next);

            expect(mockQuiz.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                masteryUpdated: false
            }));

            consoleSpy.mockRestore();
        });
    });

    describe('getQuizResults', () => {
        it('should return 404 if quiz is not found', async () => {
            req.params = { id: 'quiz_missing' };
            Quiz.findOne.mockReturnValue({
                populate: vi.fn().mockResolvedValue(null)
            });

            await getQuizResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Quiz not found'
            }));
        });

        it('should return 400 if quiz has not been completed yet', async () => {
            req.params = { id: 'quiz_incomplete' };
            Quiz.findOne.mockReturnValue({
                populate: vi.fn().mockResolvedValue({
                    _id: 'quiz_incomplete',
                    completedAt: null
                })
            });

            await getQuizResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Quiz not completed yet'
            }));
        });

        it('should return 200 with formatted question-by-question review results', async () => {
            req.params = { id: 'quiz_done' };

            const mockCompletedQuiz = {
                _id: 'quiz_done',
                title: 'Operating Systems',
                documentId: { title: 'OS Lecture Notes' },
                score: 100,
                totalQuestions: 1,
                completedAt: new Date('2026-02-01'),
                questions: [
                    {
                        question: 'What is a process?',
                        options: ['Program in execution', 'A file', 'A mouse', 'A monitor'],
                        correctOption: 1,
                        explanation: 'A process is an active program in execution.'
                    }
                ],
                userAnswers: [
                    {
                        questionIndex: 0,
                        selectedAnswer: 'Program in execution',
                        isCorrect: true
                    }
                ]
            };

            Quiz.findOne.mockReturnValue({
                populate: vi.fn().mockResolvedValue(mockCompletedQuiz)
            });

            await getQuizResults(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    quiz: {
                        id: 'quiz_done',
                        title: 'Operating Systems',
                        document: { title: 'OS Lecture Notes' },
                        score: 100,
                        totalQuestions: 1,
                        completedAt: mockCompletedQuiz.completedAt
                    },
                    results: [
                        {
                            questionIndex: 0,
                            question: 'What is a process?',
                            options: ['Program in execution', 'A file', 'A mouse', 'A monitor'],
                            correctOption: 1,
                            selectedAnswer: 'Program in execution',
                            isCorrect: true,
                            explanation: 'A process is an active program in execution.'
                        }
                    ]
                }
            });
        });
    });

    describe('deleteQuiz', () => {
        it('should return 404 if quiz to delete does not exist', async () => {
            req.params = { id: 'quiz_missing' };
            Quiz.findOne.mockResolvedValue(null);

            await deleteQuiz(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Quiz not found'
            }));
        });

        it('should delete quiz and return 200 success', async () => {
            req.params = { id: 'quiz_123' };
            const mockQuiz = {
                _id: 'quiz_123',
                deleteOne: vi.fn().mockResolvedValue(true)
            };

            Quiz.findOne.mockResolvedValue(mockQuiz);

            await deleteQuiz(req, res, next);

            expect(mockQuiz.deleteOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Quiz deleted successfully'
            });
        });
    });
});
