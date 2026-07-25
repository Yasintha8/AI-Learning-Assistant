import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, BrainCircuit } from 'lucide-react';
import toast from '../../utils/toast';
import quizService from '../../services/quizService';
import aiService from '../../services/aiService';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import Modal from '../common/Modal';
import QuizCard from './QuizCard';

const QuizManager = ({ documentId }) => {

    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [numQuestions, setNumQuestions] = useState(5);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const data = await quizService.getQuizzesForDocument(documentId);
            setQuizzes(data.data);
        } catch (error) {
            toast.error('Failed to fetch quizzes.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (documentId) {
            fetchQuizzes();
        }
    }, [documentId]);

    const handleGenerateQuiz = async (e) => {
        e.preventDefault();
        setGenerating(true);
        try {
            await aiService.generateQuiz(documentId, { numQuestions });
            toast.success('Quiz generated successfully!');
            setIsGenerateModalOpen(false);
            fetchQuizzes();
        } catch (error) {
            toast.error(error.message || 'Failed to generate quiz.');
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteRequest = (quiz) => {
        setSelectedQuiz(quiz);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedQuiz) return;
        setDeleting(true);
        try {
            await quizService.deleteQuiz(selectedQuiz._id);
            toast.success('Quiz deleted successfully!');
            setIsDeleteModalOpen(false);
            setSelectedQuiz(null);
            fetchQuizzes();
        } catch (error) {
            toast.error(error.message || 'Failed to delete quiz.');
        } finally {
            setDeleting(false);
        }
    };

    const renderQuizContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <Spinner />
                </div>
            );
        }

        if (quizzes.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center text-center gap-4 py-16 px-6">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                        <BrainCircuit className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-base font-bold text-text-heading tracking-tight">
                            No Quizzes Yet
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed max-w-xs">
                            Generate a quiz from your document to test your knowledge and
                            track your mastery.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="h-12 px-6 rounded-xl bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200 cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4" strokeWidth={2} />
                        Generate Quiz
                    </button>
                </div>
            );
        }

        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {quizzes.map((quiz) => (
                    <QuizCard
                        key={quiz._id}
                        quiz={quiz}
                        onDelete={handleDeleteRequest}
                    />
                ))}
            </div>
        )
    };

    return (
        <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
            {quizzes.length > 0 && (
                <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border-light">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <BrainCircuit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-text-heading">Quizzes</h3>
                            <p className="text-xs text-text-muted">
                                {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"} generated
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setIsGenerateModalOpen(true)} className="shrink-0 cursor-pointer">
                        <Plus size={16} strokeWidth={2.5} />
                        Generate Quiz
                    </Button>
                </div>
            )}

            <div className="p-6">
                {renderQuizContent()}
            </div>

            {/* Generate Quiz */}
            <Modal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                title="Generate New Quiz"
            >
                <form onSubmit={handleGenerateQuiz} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-text-body uppercase tracking-wider">
                            Number of Questions
                        </label>
                        <input
                            type="number"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            required
                            className="h-11 px-4 rounded-xl border border-border-medium bg-bg-main text-sm text-text-body placeholder:text-text-placeholder hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150 w-full"
                        />
                        <p className="text-xs text-text-muted">
                            Specify how many questions you would like the AI to generate based on this document.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsGenerateModalOpen(false)}
                            disabled={generating}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={generating}>
                            {generating ? (
                                <span className="inline-flex items-center justify-center gap-2">
                                    <Spinner size="sm" tone="white" inline />
                                    Generating...
                                </span>
                            ) : (
                                'Generate'
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/*Delete Confirmation*/}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Quiz?"
            >
                <div className="flex flex-col gap-5">
                    <p className="text-sm text-text-muted leading-relaxed">
                        Are you sure you want to delete <span className="text-text-body text-sm font-semibold">{selectedQuiz?.title || 'this quiz'}</span>? This action
                        cannot be undone and all questions will be permanently removed.
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={deleting}
                            className="flex-1 h-11 rounded-xl border border-border-medium bg-bg-card text-sm font-semibold text-text-body hover:bg-border-light transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                            className="flex-1 h-11 rounded-xl bg-error text-white text-sm font-semibold hover:opacity-90 transition-opacity duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {deleting ? (
                                <span className="inline-flex items-center justify-center gap-2">
                                    <Spinner size="sm" tone="white" inline />
                                    Deleting...
                                </span>
                            ) : (
                                "Delete Quiz"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default QuizManager;
