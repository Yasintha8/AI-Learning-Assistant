import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Search documents, flashcards and quizzes for the logged-in user
// @route   GET /api/search?q=term
// @access  Private
export const globalSearch = async (req, res, next) => {
    try {
        const q = (req.query.q || '').trim();

        if (q.length < 2) {
            return res.status(200).json({
                success: true,
                data: { documents: [], flashcards: [], quizzes: [] },
            });
        }

        const regex = new RegExp(escapeRegex(q), 'i');
        const RESULT_LIMIT = 5;

        const [documents, flashcardSets, quizzes] = await Promise.all([
            Document.find({ userId: req.user._id, title: regex })
                .select('title fileType status')
                .limit(RESULT_LIMIT),

            Flashcard.find({
                userId: req.user._id,
                $or: [{ 'cards.question': regex }, { 'cards.answer': regex }],
            })
                .populate('documentId', 'title')
                .limit(RESULT_LIMIT),

            Quiz.find({
                userId: req.user._id,
                $or: [{ title: regex }, { 'questions.question': regex }],
            })
                .select('title documentId completedAt')
                .limit(RESULT_LIMIT),
        ]);

        const flashcardResults = flashcardSets
            .filter((set) => set.documentId)
            .map((set) => {
                const matchedCard = set.cards.find(
                    (card) => regex.test(card.question) || regex.test(card.answer)
                );
                return {
                    id: set._id,
                    documentId: set.documentId._id,
                    documentTitle: set.documentId.title,
                    question: matchedCard?.question || '',
                };
            });

        res.status(200).json({
            success: true,
            data: {
                documents,
                flashcards: flashcardResults,
                quizzes,
            },
        });
    } catch (error) {
        next(error);
    }
};