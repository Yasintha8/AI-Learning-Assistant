import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    generateResourceGraph,
    getResourceGraph
} from '../controllers/resourceController.js';
import Document from '../models/Document.js';
import ResourceGraph from '../models/ResourceGraph.js';
import * as claudeService from '../utils/claudeService.js';

// Mock dependencies
vi.mock('../models/Document.js', () => ({
    default: {
        findOne: vi.fn()
    }
}));

vi.mock('../models/ResourceGraph.js', () => ({
    default: {
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn()
    }
}));

vi.mock('../utils/claudeService.js', () => ({
    generateRelatedResources: vi.fn()
}));

describe('Related Resources Feature - Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            user: { _id: 'user_abc123' },
            body: { documentId: 'doc_xyz789' },
            params: {}
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        next = vi.fn();
    });

    describe('generateResourceGraph', () => {
        it('should return 400 if documentId is missing', async () => {
            req.body = {};

            await generateResourceGraph(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Please provide documentId',
                statusCode: 400
            }));
            expect(Document.findOne).not.toHaveBeenCalled();
        });

        it('should return 404 if document is not found or not in ready status', async () => {
            Document.findOne.mockResolvedValue(null);

            await generateResourceGraph(req, res, next);

            expect(Document.findOne).toHaveBeenCalledWith({
                _id: 'doc_xyz789',
                userId: 'user_abc123',
                status: 'ready'
            });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Document not found or not ready',
                statusCode: 404
            }));
        });

        it('should return cached resource graph with 200 without calling AI when not forced', async () => {
            const mockDoc = {
                _id: 'doc_xyz789',
                userId: 'user_abc123',
                status: 'ready',
                extractedText: 'React and State Management documentation'
            };

            const existingGraph = {
                _id: 'graph_123',
                userId: 'user_abc123',
                documentId: 'doc_xyz789',
                concepts: [{ conceptId: 'c1', title: 'React Hooks' }],
                resources: [{ resourceId: 'r1', title: 'Official React Docs', url: 'https://react.dev' }]
            };

            Document.findOne.mockResolvedValue(mockDoc);
            ResourceGraph.findOne.mockResolvedValue(existingGraph);

            await generateResourceGraph(req, res, next);

            expect(ResourceGraph.findOne).toHaveBeenCalledWith({
                userId: 'user_abc123',
                documentId: 'doc_xyz789'
            });
            expect(claudeService.generateRelatedResources).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: existingGraph,
                message: 'Related resources are up to date'
            });
        });

        it('should bypass cache and call AI service when force is true', async () => {
            req.body = { documentId: 'doc_xyz789', force: true };

            const mockDoc = {
                _id: 'doc_xyz789',
                userId: 'user_abc123',
                status: 'ready',
                extractedText: 'Updated Neural Network notes'
            };

            const freshAiResult = {
                concepts: [
                    { conceptId: 'deep-learning', title: 'Deep Learning' }
                ],
                resources: [
                    {
                        resourceId: 'res-1',
                        title: '3Blue1Brown Neural Networks',
                        url: 'https://youtube.com/watch?v=aircAruvnKk',
                        type: 'video',
                        description: 'Visual introduction to neural networks',
                        conceptIds: ['deep-learning']
                    }
                ]
            };

            const updatedGraph = {
                _id: 'graph_123',
                userId: 'user_abc123',
                documentId: 'doc_xyz789',
                ...freshAiResult,
                generatedAt: new Date()
            };

            Document.findOne.mockResolvedValue(mockDoc);
            claudeService.generateRelatedResources.mockResolvedValue(freshAiResult);
            ResourceGraph.findOneAndUpdate.mockResolvedValue(updatedGraph);

            await generateResourceGraph(req, res, next);

            // Bypassed findOne check
            expect(ResourceGraph.findOne).not.toHaveBeenCalled();

            // Called AI service
            expect(claudeService.generateRelatedResources).toHaveBeenCalledWith(mockDoc.extractedText);

            // Saved to database
            expect(ResourceGraph.findOneAndUpdate).toHaveBeenCalledWith(
                { userId: 'user_abc123', documentId: 'doc_xyz789' },
                expect.objectContaining({
                    userId: 'user_abc123',
                    documentId: 'doc_xyz789',
                    concepts: freshAiResult.concepts,
                    resources: freshAiResult.resources
                }),
                { new: true, upsert: true }
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: updatedGraph,
                message: 'Related resources generated successfully'
            });
        });

        it('should call AI service and create new graph when no cached graph exists', async () => {
            req.body = { documentId: 'doc_xyz789', force: false };

            const mockDoc = {
                _id: 'doc_xyz789',
                userId: 'user_abc123',
                status: 'ready',
                extractedText: 'Cloud Computing Fundamentals'
            };

            const freshAiResult = {
                concepts: [{ conceptId: 'c1', title: 'Serverless' }],
                resources: [{ resourceId: 'r1', title: 'AWS Lambda Guide', url: 'https://aws.amazon.com', type: 'article' }]
            };

            Document.findOne.mockResolvedValue(mockDoc);
            ResourceGraph.findOne.mockResolvedValue(null); // No cache found
            claudeService.generateRelatedResources.mockResolvedValue(freshAiResult);
            ResourceGraph.findOneAndUpdate.mockResolvedValue({
                _id: 'graph_999',
                userId: 'user_abc123',
                documentId: 'doc_xyz789',
                ...freshAiResult
            });

            await generateResourceGraph(req, res, next);

            expect(ResourceGraph.findOne).toHaveBeenCalledWith({
                userId: 'user_abc123',
                documentId: 'doc_xyz789'
            });
            expect(claudeService.generateRelatedResources).toHaveBeenCalledWith('Cloud Computing Fundamentals');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Related resources generated successfully'
            }));
        });

        it('should pass unhandled errors to next()', async () => {
            const error = new Error('Database connection failed');
            Document.findOne.mockRejectedValue(error);

            await generateResourceGraph(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getResourceGraph', () => {
        it('should return 404 if no resource graph exists for the document', async () => {
            req.params = { documentId: 'doc_unknown' };
            ResourceGraph.findOne.mockResolvedValue(null);

            await getResourceGraph(req, res, next);

            expect(ResourceGraph.findOne).toHaveBeenCalledWith({
                userId: 'user_abc123',
                documentId: 'doc_unknown'
            });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'No related resources generated yet for this document',
                statusCode: 404
            }));
        });

        it('should return 200 with the resource graph data when found', async () => {
            req.params = { documentId: 'doc_xyz789' };
            const mockGraph = {
                _id: 'graph_123',
                userId: 'user_abc123',
                documentId: 'doc_xyz789',
                concepts: [{ conceptId: 'c1', title: 'Data Structures' }],
                resources: [{ resourceId: 'r1', title: 'GeeksforGeeks', url: 'https://geeksforgeeks.org' }]
            };

            ResourceGraph.findOne.mockResolvedValue(mockGraph);

            await getResourceGraph(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockGraph
            });
        });

        it('should pass unhandled errors to next()', async () => {
            req.params = { documentId: 'doc_xyz789' };
            const error = new Error('Network error');
            ResourceGraph.findOne.mockRejectedValue(error);

            await getResourceGraph(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
