import React, { useState, useEffect } from "react";
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    Trash2,
    ArrowLeft,
    Sparkles,
    Brain,
    TrendingUp,
} from "lucide-react";
import toast from '../../utils/toast';
import moment from "moment";

import flashcardService from "../../services/flashcardService";
import aiService from "../../services/aiService";
import Spinner from "../common/Spinner";
import Modal from "../common/Modal";
import Flashcard from "./Flashcard";

const FlashcardManager = ({ documentId }) => {

    const [flashcardSets, setFlashcardSets] = useState([]);
    const [selectedSet, setSelectedSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [setToDelete, setSetToDelete] = useState(null);

    const fetchFlashcardSets = async () => {
        setLoading(true);
        try {
            const response = await flashcardService.getFlashcardsForDocument(
                documentId
            );
            setFlashcardSets(response.data);
        } catch (error) {
            toast.error("Failed to fetch flashcard sets.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (documentId) {
            fetchFlashcardSets();
        }
    }, [documentId]);

    const handleGenerateFlashcards = async () => {
        setGenerating(true);
        try {
            await aiService.generateFlashcards(documentId);
            toast.success("Flashcards generated successfully!");
            fetchFlashcardSets();
        } catch (error) {
            toast.error(error.message || "Failed to generate flashcards.");
        } finally {
            setGenerating(false);
        }
    };

    const handleNextCard = () => {
        if (selectedSet) {
            handleReview(currentCardIndex);
            setCurrentCardIndex(
                (prevIndex) => (prevIndex + 1) % selectedSet.cards.length
            );
        }
    };

    const handlePrevCard = () => {
        if (selectedSet) {
            handleReview(currentCardIndex);
            setCurrentCardIndex(
                (prevIndex) =>
                    (prevIndex - 1 + selectedSet.cards.length) % selectedSet.cards.length
            );
        }
    };

    const handleReview = async (index) => {
        const currentCard = selectedSet?.cards[currentCardIndex];
        if (!currentCard) return;

        try {
            await flashcardService.reviewFlashcard(currentCard._id, index);
            toast.success("Flashcard reviewed!");
        } catch (error) {
            toast.error("Failed to review flashcard.");
        }
    };

    const handleToggleStar = async (cardId) => {
        try {
            await flashcardService.toggleStar(cardId);
            const updatedSets = flashcardSets.map((set) => {
                if (set._id === selectedSet._id) {
                    const updatedCards = set.cards.map((card) =>
                        card._id === cardId ? { ...card, isStarred: !card.isStarred } : card
                    );
                    return { ...set, cards: updatedCards };
                }
                return set;
            });
            setFlashcardSets(updatedSets);
            setSelectedSet(updatedSets.find((set) => set._id === selectedSet._id));
            toast.success("Flashcard starred status updated!");
        } catch (error) {
            toast.error("Failed to update star status.")
        }
    };

    const handleDeleteRequest = (e, set) => {
        e.stopPropagation();
        setSetToDelete(set);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!setToDelete) return;
        setDeleting(true);
        try {
            await flashcardService.deleteFlashcardSet(setToDelete._id);
            toast.success("Flashcard set deleted successfully!");
            setIsDeleteModalOpen(false);
            setSetToDelete(null);
            fetchFlashcardSets();
        } catch (error) {
            toast.error(error.message || "Failed to delete flashcard set.");
        } finally {
            setDeleting(false);
        }
    };

    const handleSelectSet = (set) => {
        setSelectedSet(set);
        setCurrentCardIndex(0);
    };

    const renderFlashcardViewer = () => {
        const currentCard = selectedSet.cards[currentCardIndex];

        return (
            <div className="flex flex-col gap-5">
                {/* Back Button */}
                <button
                    onClick={() => setSelectedSet(null)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-heading transition-colors duration-150 w-fit cursor-pointer"
                >
                    <ArrowLeft
                        className="w-4 h-4"
                        strokeWidth={2}
                    />
                    Back to Sets
                </button>

                {/* Flashcard Display */}
                <div className="flex flex-col items-center space-y-8">
                    <div className="w-full max-w-2xl">
                        <Flashcard
                            flashcard={currentCard}
                            onToggleStar={handleToggleStar}
                        />
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between gap-4 mt-4">
                        <button
                            onClick={handlePrevCard}
                            disabled={selectedSet.cards.length <= 1}
                            className="inline-flex items-center gap-2 py-2  px-4 rounded-lg border border-border-medium bg-bg-card text-sm font-semibold text-text-body hover:bg-border-light hover:border-border-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft
                                className="w-4 h-4"
                                strokeWidth={2.5}
                            />
                            Previous
                        </button>

                        <div className="flex items-center rounded-lg border border-border-medium px-4 py-2 justify-center">
                            <span className="text-sm font-semibold text-text-heading tabular-nums">
                                {currentCardIndex + 1}{" "}
                                <span className="text-text-muted font-normal">/</span>{" "}
                                {selectedSet.cards.length}
                            </span>
                        </div>

                        <button
                            onClick={handleNextCard}
                            disabled={selectedSet.cards.length <= 1}
                            className="inline-flex items-center gap-2 py-2  px-4 rounded-lg border border-border-medium bg-bg-card text-sm font-semibold text-text-body hover:bg-border-light hover:border-border-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Next
                            <ChevronRight
                                className="w-4 h-4"
                                strokeWidth={2.5}
                            />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderSetList = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <Spinner />
                </div>
            )
        }


        if (flashcardSets.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center text-center gap-4 py-16 px-6">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-sm">
                        <Brain className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-base font-bold text-text-heading tracking-tight">
                            No Flashcards Yet
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed max-w-xs">
                            Generate flashcards from your document to start learning and
                            reinforce your knowledge.
                        </p>
                    </div>
                    <button
                        onClick={handleGenerateFlashcards}
                        disabled={generating}
                        className="h-12 px-6 rounded-xl bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {generating ? (
                            <>
                                <Spinner size="sm" tone="white" inline />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" strokeWidth={2} />
                                Generate Flashcards
                            </>
                        )}
                    </button>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {flashcardSets.map((set, index) => {
                    const totalCards = set.cards.length;
                    const reviewedCount = set.cards.filter((card) => !!card.lastReviewed).length;
                    const progressPercentage = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;

                    return (
                        <div
                            key={set._id}
                            onClick={() => handleSelectSet(set)}
                            className="group relative h-full flex flex-col gap-4 cursor-pointer rounded-2xl border border-border-medium/50 bg-bg-card p-5 shadow-sm hover:shadow-md hover:border-border-medium transition-all duration-200 overflow-hidden"
                        >
                            {/* Delete action, pinned to the card's corner */}
                            <button
                                onClick={(e) => handleDeleteRequest(e, set)}
                                className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center bg-bg-card border border-border-light text-text-muted hover:text-error hover:bg-error-bg shadow-sm transition-all duration-150 opacity-0 group-hover:opacity-100 cursor-pointer"
                                aria-label="Delete flashcard set"
                            >
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                            </button>

                            {/* Icon */}
                            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-primary to-blue-400 flex items-center justify-center shadow-sm shadow-primary-shadow shrink-0 transition-transform duration-300 group-hover:scale-105">
                                <Brain className="w-5 h-5 text-white" strokeWidth={2} />
                            </div>

                            {/* Title */}
                            <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-text-heading truncate">
                                    Set {index + 1}
                                </h4>
                                <p className="mt-1 text-xs text-text-muted">
                                    Created {moment(set.createdAt).fromNow()}
                                </p>
                            </div>

                            {/* Progress */}
                            <div className="mt-auto flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-medium text-text-body">Progress</span>
                                        {reviewedCount > 0 && (
                                            <div className="flex items-center gap-0.5 rounded-full bg-primary-light px-1.5 py-0.5 text-primary">
                                                <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                                                <span className="text-[10px] font-bold">{progressPercentage}%</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-text-muted">
                                        {reviewedCount}/{totalCards} reviewed
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-border-light">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-700"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Hover indicator */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary to-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (

        <>
            <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
                {!selectedSet && (
                    <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border-light">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                                <Brain className="w-4 h-4 text-primary" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-text-heading">Flashcard Sets</h3>
                                <p className="text-xs text-text-muted">
                                    {flashcardSets.length} {flashcardSets.length === 1 ? "set" : "sets"} available
                                </p>
                            </div>
                        </div>
                        {flashcardSets.length > 0 && (
                            <button
                                onClick={handleGenerateFlashcards}
                                disabled={generating}
                                className="shrink-0 h-10 px-4 rounded-xl bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {generating ? (
                                    <>
                                        <Spinner size="sm" tone="white" inline />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                                        Generate New Set
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}

                <div className="p-6">
                    {selectedSet ? renderFlashcardViewer() : renderSetList()}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Flashcard Set?"
            >
                <div className="flex flex-col gap-5">
                    <p className="text-sm text-text-muted leading-relaxed">
                        Are you sure you want to delete this flashcard set? This action
                        cannot be undone and all cards will be permanently removed.
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
                                "Delete Set"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default FlashcardManager
