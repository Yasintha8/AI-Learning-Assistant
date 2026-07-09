import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, TrendingUp } from "lucide-react";
import moment from "moment";

const FlashcardSetCard = ({ flashcardSet }) => {

    const navigate = useNavigate();

    const handleStudyNow = () => {
        navigate(`/documents/${flashcardSet.documentId._id}/flashcards`);
    };

    const totalCards = flashcardSet.cards.length;

    const reviewedCards = flashcardSet.cards.filter(card => {
        console.log("lastReviewed:", card => card.reviewCount > 0);
        return !!card.lastReviewed;
    });

    const reviewedCount = reviewedCards.length;

    console.log({
        title: flashcardSet.documentId.title,
        totalCards,
        reviewedCount,
    });
    const progressPercentage = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;
    console.log(flashcardSet.cards[0]);

    return (
        <div
            onClick={handleStudyNow}
            className="group cursor-pointer rounded-2xl border border-border-medium bg-bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
        >
            <div className="flex flex-col gap-5">

                {/* Header */}
                <div className="flex flex-col items-start justify-between gap-4">

                    <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-light text-primary transition-transform duration-300 group-hover:scale-105">
                            <BookOpen className="h-7 w-7" strokeWidth={2} />
                        </div>

                        <div className="min-w-0">
                            <h3
                                title={flashcardSet.documentId?.title}
                                className="line-clamp-3 font-display text-md font-bold leading-6 text-text-heading"
                            >
                                {flashcardSet.documentId?.title}
                            </h3>

                            <p className="mt-1 text-sm text-text-muted">
                                Created {moment(flashcardSet.createdAt).fromNow()}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-full border border-border-medium bg-bg-main px-3 py-1.5 text-sm font-semibold text-text-body">
                        {totalCards} {totalCards === 1 ? "Card" : "Cards"}
                    </div>

                </div>

                {/* Progress */}
                {totalCards > 0 && (
                    <>
                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-text-body">
                                    Progress
                                </span>

                                {reviewedCount > 0 && (
                                    <div className="flex items-center gap-1 rounded-full bg-primary-light px-2 py-1 text-primary">
                                        <TrendingUp
                                            className="h-4 w-4"
                                            strokeWidth={2.5}
                                        />
                                        <span className="text-xs font-bold">
                                            {progressPercentage}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            <span className="text-sm text-text-muted">
                                {reviewedCount}/{totalCards} reviewed
                            </span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-border-light">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-700"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </>
                )}

                {/* Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleStudyNow();
                    }}
                    className="group/button mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary-shadow cursor-pointer"
                >
                    <Sparkles
                        className="h-4 w-4 transition-transform duration-300 group-hover/button:rotate-12"
                        strokeWidth={2.5}
                    />
                    <span className="text-md">Study Now</span>
                </button>

            </div>
        </div>
    );
};

export default FlashcardSetCard;