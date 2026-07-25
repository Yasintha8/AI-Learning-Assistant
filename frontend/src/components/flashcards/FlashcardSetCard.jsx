import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, TrendingUp, Trash2 } from "lucide-react";
import moment from "moment";

const FlashcardSetCard = ({ flashcardSet, onDelete }) => {

    const navigate = useNavigate();

    const handleStudyNow = () => {
        if (!flashcardSet.documentId?._id) return;
        navigate(`/documents/${flashcardSet.documentId._id}/flashcards`);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete?.(flashcardSet);
    };

    const totalCards = flashcardSet.cards.length;
    const reviewedCount = flashcardSet.cards.filter((card) => !!card.lastReviewed).length;
    const progressPercentage = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;

    return (
        <div
            onClick={handleStudyNow}
            className="relative group h-full flex flex-col gap-4 cursor-pointer rounded-2xl border border-border-medium/50 bg-bg-card p-5 shadow-sm hover:shadow-md hover:border-border-medium transition-all duration-200 overflow-hidden"
        >
            {/* Delete action, pinned to the card's corner */}
            {onDelete && (
                <button
                    onClick={handleDelete}
                    className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center bg-bg-card border border-border-light text-text-muted hover:text-error hover:bg-error-bg shadow-sm transition-all duration-150 opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                    aria-label="Delete flashcard set"
                >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
            )}

            {/* Header */}
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-105">
                <BookOpen className="w-5 h-5 text-white" strokeWidth={2} />
            </div>

            {/* Title */}
            <div className="min-w-0" title={flashcardSet.documentId?.title}>
                <h3 className="text-sm font-semibold text-text-heading leading-snug line-clamp-2">
                    {flashcardSet.documentId?.title || "Untitled document"}
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                    Created {moment(flashcardSet.createdAt).fromNow()}
                </p>
            </div>

            {/* Progress */}
            <div className="mt-auto flex flex-col gap-2">
                {totalCards > 0 && (
                    <>
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
                    </>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleStudyNow();
                    }}
                    className="group/button mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary-shadow cursor-pointer"
                >
                    <Sparkles
                        className="w-3.5 h-3.5 transition-transform duration-300 group-hover/button:rotate-12"
                        strokeWidth={2.5}
                    />
                    Study Now
                </button>
            </div>

            {/* Hover indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-violet-400 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
        </div>
    );
};

export default FlashcardSetCard;