import Document from '../models/Document.js';
import ResourceGraph from '../models/ResourceGraph.js';
import * as aiService from '../utils/ai/index.js';

// @desc    Generate (or return cached) AI-suggested related resources for a document
// @route   POST /api/resources/generate
// @access  Private
export const generateResourceGraph = async (req, res, next) => {
    try {
        const { documentId, force } = req.body;

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

        if (!force) {
            const existing = await ResourceGraph.findOne({ userId: req.user._id, documentId });
            if (existing) {
                return res.status(200).json({
                    success: true,
                    data: existing,
                    message: 'Related resources are up to date'
                });
            }
        }

        const { concepts, resources } = await aiService.generateRelatedResources(document.extractedText);

        const resourceGraph = await ResourceGraph.findOneAndUpdate(
            { userId: req.user._id, documentId },
            {
                userId: req.user._id,
                documentId,
                concepts,
                resources,
                generatedAt: new Date()
            },
            { new: true, upsert: true }
        );

        res.status(201).json({
            success: true,
            data: resourceGraph,
            message: 'Related resources generated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get the cached resource graph for a document
// @route   GET /api/resources/:documentId
// @access  Private
export const getResourceGraph = async (req, res, next) => {
    try {
        const resourceGraph = await ResourceGraph.findOne({
            userId: req.user._id,
            documentId: req.params.documentId
        });

        if (!resourceGraph) {
            return res.status(404).json({
                success: false,
                error: 'No related resources generated yet for this document',
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            data: resourceGraph
        });
    } catch (error) {
        next(error);
    }
};