import { useState } from "react";
import { Star, RotateCcw } from "lucide-react";

const Flashcard = ({ flashcard, onToggleStar }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div className="relative w-full h-72" style={{ perspective: '1000px' }}>
            <div
                className="relative w-full h-full transition-transform duration-500 transform-gpu cursor-pointer"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
                onClick={handleFlip}
            >
                {/* Front of the card (Question) */}
                <div
                    className="absolute inset-0 bg-bg-card border border-border-light rounded-2xl shadow-sm flex flex-col overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
                        {(() => {
                            const styles = {
                                easy: 'bg-emerald-50 border border-emerald-100 text-emerald-600',
                                medium: 'bg-amber-50 border border-amber-100 text-amber-600',
                                hard: 'bg-error-bg border border-error-border text-error',
                            };
                            const level = flashcard?.difficulty ?? 'medium';
                            return (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${styles[level]}`}>
                                    {level}
                                </span>
                            );
                        })()}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleStar(flashcard._id);
                            }}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration- 200 cursor-pointer
                                ${flashcard.isStarred
                                    ? 'bg-linear-to-br from-amber-400 to-yellow-500 text-white shadow-sm'
                                    : 'bg-border-light text-text-muted hover:bg-amber-50 hover:text-amber-500'
                                }`}
                        >
                            <Star className="w-4 h-4" strokeWidth={2} fill={flashcard.isStarred ? 'currentColor' : 'none'} />
                        </button>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 flex items-center justify-center px-6 py-4">
                        <p className="text-base font-semibold text-text-heading text-center leading-relaxed">
                            {flashcard.question}
                        </p>
                    </div>

                    {/* Flip Indicator */}
                    <div className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-border-light bg-border-light/40">
                        <RotateCcw className="w-3.5 h-3.5 text-text-muted" strokeWidth={2} />
                        <span className="text-xs text-text-muted">Click to reveal answer</span>
                    </div>
                </div>

                {/* Back of the card (Answer) */}
                <div
                    className="absolute inset-0 bg-linear-to-br from-primary to-blue-400 rounded-2xl shadow-sm shadow-primary-shadow flex flex-col overflow-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/20">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/20 text-xs font-semibold text-white capitalize">
                            Answer
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleStar(flashcard._id);
                            }}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer
                                ${flashcard.isStarred
                                    ? 'bg-white/30 text-white shadow-sm'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                }`}
                        >
                            <Star className="w-4 h-4" strokeWidth={2} fill={flashcard.isStarred ? 'currentColor' : 'none'} />
                        </button>
                    </div>

                    {/* Answer Content */}
                    <div className="flex-1 flex items-center justify-center px-6 py-4">
                        <p className="text-base font-semibold text-white text-center leading-relaxed">
                            {flashcard.answer}
                        </p>
                    </div>

                    {/* Flip back indicator */}
                    <div className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-white/20 bg-white/10">
                        <RotateCcw className="w-3.5 h-3.5 text-white/60" strokeWidth={2} />
                        <span className="text-xs text-white/60">Click to see question</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Flashcard;