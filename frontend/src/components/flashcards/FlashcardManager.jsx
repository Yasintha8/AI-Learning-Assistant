import React, { useState, useEffect } from "react";
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    Trash2,
    ArrowLeft,
    Sparkles,
    Brain,
} from "lucide-react";
import toast from "react-hot-toast";
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

                        <div className="flex items-center rounded-lg border border-slate-200 px-4 py-2 justify-center">
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
            <div className="flex flex-col gap-5">
                {/* Header with Generate Button */}
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                        <h3 className="text-base font-bold text-text-heading tracking-tight">
                            Your Flashcard Sets
                        </h3>
                        <p className="text-xs text-text-muted">
                            {flashcardSets.length}{" "}
                            {flashcardSets.length === 1 ? "set" : "sets"} available
                        </p>
                    </div>
                    <button
                        onClick={handleGenerateFlashcards}
                        disabled={generating}
                        className="shrink-0 h-11 px-5 rounded-xl bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                </div>

                {/* Flashcard Sets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {flashcardSets.map((set) => (
                        <div
                            key={set._id}
                            onClick={() => handleSelectSet(set)}
                            className="group relative bg-bg-card border px-2 py-4 border-border-medium shadow-xs rounded-2xl flex flex-col cursor-pointer hover:shadow-md hover:border-primary-hover/50 transition-all duration-200 overflow-hidden"
                        >
                            {/* Delete Button */}
                            <button
                                onClick={(e) => handleDeleteRequest(e, set)}
                                className="absolute top-5 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-error hover:bg-error-bg opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer z-10"
                            >
                                <Trash2 className="4 h-4" strokeWidth={2} />
                            </button>

                            {/* Icon area — tinted top block */}
                            <div className="flex px-4 py-4">
                                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary to-blue-400 flex items-center justify-center shadow-sm shadow-primary-shadow">
                                    <Brain className="w-6 h-6 text-white" strokeWidth={2} />
                                </div>
                            </div>

                            {/* Card body */}
                            <div className="flex flex-col gap-3 px-4 pb-5">
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-text-heading truncate">
                                        Flashcard Set
                                    </h4>
                                    <p className="text-xs text-text-muted uppercase tracking-wider mt-0.5">
                                        Created {moment(set.createdAt).format("MMM D, YYYY")}
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <div className="inline-flex items-center gap-2 border border-violet-100 bg-violet-50 px-3 py-1 rounded-lg">
                                        <span className="text-xs font-semibold text-violet-500">
                                            {set.cards.length}{" "}
                                            {set.cards.length === 1 ? "card" : "cards"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Hover indicator */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary to-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (

        <>
            <div className="border border-border-light rounded-3xl shadow-xs p-8 ">
                {selectedSet ? renderFlashcardViewer() : renderSetList()}
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