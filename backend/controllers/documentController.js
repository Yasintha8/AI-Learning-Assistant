import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { extractTextFromDOCX } from '../utils/docxParser.js';
import { extractTextFromPPTX } from '../utils/pptxParser.js';
import { extractTextFromYouTube } from '../utils/youtubeParser.js';
import { extractTextFromWebsite } from '../utils/websiteParser.js';
import { chunkText } from '../utils/textChunker.js';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';

const EXTENSION_TO_FILE_TYPE = {
    '.pdf': 'pdf',
    '.docx': 'docx',
    '.pptx': 'pptx',
};
const YOUTUBE_URL_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

// Determine whether a URL points to a YouTube video or a generic website
const detectLinkType = (url) => {
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return YOUTUBE_URL_REGEX.test(url) ? 'youtube' : 'website';
};

// @desc Upload PDF, DOCX or PPTX document
// @route POST /api/documents/upload
// @access Private
export const uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Please upload a PDF, DOCX or PPTX file',
                statusCode: 400
            })
        }

        const { title } = req.body;

        if (!title) {
            //Delete uploaded file if no title provided
            await fs.unlink(req.file.path);
            return res.status(400).json({
                success: false,
                error: "Please provide a document title",
                statusCode: 400,
            });
        }

        // Construct the URL for the uploaded file
        const baseUrl = `http://localhost:${process.env.PORT || 8000}`;
        const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;
        const ext = path.extname(req.file.originalname).toLowerCase();
        const fileType = EXTENSION_TO_FILE_TYPE[ext] || 'pdf';

        //Create document record
        const document = await Document.create({
            userId: req.user._id,
            title,
            fileName: req.file.originalname,//Original name of the uploaded file
            filePath: fileUrl,//Store the URL instead of the local path
            fileSize: req.file.size,
            fileType,
            status: 'processing'
        })

        // Process document in background
        processDocument(document._id, req.file.path, fileType).catch(err => {
            console.error('Document processing error:', err);

        });

        res.status(201).json({
            success: true,
            data: document,
            message: "Document uploaded successfully! Processing started...",
        });

    } catch (error) {
        //Clean up file on error
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => { });
        };
        next(error);
    }
};

// @desc Add a document from a YouTube or website link
// @route POST /api/documents/upload-url
// @access Private
export const addUrlDocument = async (req, res, next) => {
    try {
        const { url, title } = req.body;

        if (!url || !title) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a URL and a document title',
                statusCode: 400,
            });
        }

        const fileType = detectLinkType(url);
        if (!fileType) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid YouTube or website URL',
                statusCode: 400,
            });
        }

        let text;
        try {
            ({ text } = fileType === 'youtube'
                ? await extractTextFromYouTube(url)
                : await extractTextFromWebsite(url));
        } catch (extractionError) {
            return res.status(400).json({
                success: false,
                error: extractionError.message || 'Failed to extract content from the provided link',
                statusCode: 400,
            });
        }

        const chunks = chunkText(text, 500, 50);

        const document = await Document.create({
            userId: req.user._id,
            title,
            fileName: title,
            filePath: url,
            fileType,
            extractedText: text,
            chunks,
            status: 'ready',
        });

        res.status(201).json({
            success: true,
            data: document,
            message: 'Document added successfully!',
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to process an uploaded document based on its file type
const processDocument = async (documentId, filePath, fileType) => {
    try {
        let text;
        if (fileType === 'docx') {
            ({ text } = await extractTextFromDOCX(filePath));
        } else if (fileType === 'pptx') {
            ({ text } = await extractTextFromPPTX(filePath));
        } else {
            ({ text } = await extractTextFromPDF(filePath));
        }

        //Create chunks
        const chunks = chunkText(text, 500, 50);

        //Update document
        await Document.findByIdAndUpdate(documentId, {
            extractedText: text,
            chunks: chunks,
            status: 'ready'
        });

        console.log(`Docuemnt ${documentId} processed successfully`);

    } catch (error) {
        console.error(`Error processing document ${documentId}:`, error);

        await Document.findByIdAndUpdate(documentId, {
            status: 'error'
        });
    }
};

// @desc GET All Documents
// @route GET /api/documents
// @access Private
export const getDocuments = async (req, res, next) => {
    try {
        const documents = await Document.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(req.user._id) }
            },
            {
                $lookup: {
                    from: 'flashcards',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'flashcardSets'
                }
            },
            {
                $lookup: {
                    from: 'quizzes',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'quizzes'
                }
            },
            {
                $addFields: {
                    flashcardCount: { $size: "$flashcardSets" },
                    quizCount: { $size: "$quizzes" },
                }
            },
            {
                $project: {
                    extractedText: 0,
                    chunks: 0,
                    flashcardSets: 0,
                    quizzes: 0,
                }
            },
            {
                $sort: { uploadDate: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents,
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get single document with chunks
// @route GET /api/documents/:id
// @access Private
export const getDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document not found",
                statusCode: 404,
            });
        }

        //Get counts of associated flashcards and quizzes
        const flashcardCount = await Flashcard.countDocuments({ documentId: document._id, userId: req.user._id });
        const quizCount = await Quiz.countDocuments({ documentId: document._id, userId: req.user._id });

        //Update last accessed
        document.lastAccessed = Date.now();
        await document.save();

        //Combine document data with counts
        const documentData = document.toObject();
        documentData.flashcardCount = flashcardCount;
        documentData.quizCount = quizCount;

        res.status(200).json({
            success: true,
            data: documentData
        });
    } catch (error) {
        next(error);
    }
};

// @desc Delete Document
// @route DELETE /api/documents/:id
// @access Private
export const deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document not found",
                statusCode: 404,
            });
        }

        // Delete file from filesystem
        await fs.unlink(document.filePath).catch(() => { });

        // Delete document
        await document.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};


