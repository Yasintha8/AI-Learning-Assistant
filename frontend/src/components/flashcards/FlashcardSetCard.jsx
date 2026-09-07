import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, TrendingUp, Trash2, Star, ArrowRight } from "lucide-react";
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

    const totalCards = flashcardSet.cards?.length || 0;
    const reviewedCount = flashcardSet.cards?.filter((card) => !!card.lastReviewed || card.reviewCount > 0).length || 0;
    const starredCount = flashcardSet.cards?.filter((card) => card.isStarred).length || 0;
    const progressPercentage = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;

    return (
        <div
            onClick={handleStudyNow}
            className="group relative h-full flex flex-col justify-between gap-4 cursor-pointer rounded-2xl border border-border-light hover:border-primary/40 bg-bg-card p-5 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden hover:-translate-y-0.5"
        >
            {/* Delete action pinned to card corner */}
            {onDelete && (
                <button
                    onClick={handleDelete}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-xl flex items-center justify-center bg-bg-card/80 backdrop-blur-xs border border-border-light text-text-muted hover:text-rose-500 hover:bg-rose-500/10 shadow-xs transition-all duration-150 opacity-0 group-hover:opacity-100 cursor-pointer"
                    aria-label="Delete flashcard set"
                    title="Delete set"
                >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                </button>
            )}

            {/* Top Section */}
            <div className="flex flex-col gap-3.5">
                {/* Icon Header */}
                <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 shrink-0 transition-transform duration-300 group-hover:scale-105">
                        <BookOpen className="w-5 h-5" strokeWidth={2} />
                    </div>

                    {starredCount > 0 && (
                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/20">
                            <Star className="w-3.5 h-3.5" fill="currentColor" />
                            <span>{starredCount} Starred</span>
                        </div>
                    )}
                </div>

                {/* Document Title */}
                <div className="min-w-0" title={flashcardSet.documentId?.title}>
                    <h3 className="text-base font-bold text-text-heading leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {flashcardSet.documentId?.title || "Untitled Document"}
                    </h3>
                    <p className="mt-1 text-xs text-text-muted">
                        Created {moment(flashcardSet.createdAt).fromNow()}
                    </p>
                </div>
            </div>

            {/* Bottom Progress & Action Section */}
            <div className="mt-auto flex flex-col gap-3 pt-2 border-t border-border-light">
                {totalCards > 0 && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-text-muted">{reviewedCount} of {totalCards} cards reviewed</span>
                            <span className="text-primary font-bold tabular-nums">{progressPercentage}%</span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-border-light">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleStudyNow();
                    }}
                    className="w-full h-10 rounded-xl bg-primary text-white text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-primary-hover transition-all duration-200 shadow-md shadow-primary/20 cursor-pointer active:scale-98"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Study Deck</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Hover Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
        </div>
    );
};

export default FlashcardSetCard;
