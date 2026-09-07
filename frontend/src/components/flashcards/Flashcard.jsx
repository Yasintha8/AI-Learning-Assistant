import { useState } from "react";
import { Star, RotateCcw, CheckCircle, XCircle, Volume2 } from "lucide-react";

const Flashcard = ({ flashcard, onToggleStar, onReview }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleSpeak = (e, text) => {
        e.stopPropagation();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
        }
    };

    const difficultyStyles = {
        easy: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
        medium: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400',
        hard: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400',
    };

    const level = flashcard?.difficulty ?? 'medium';

    return (
        <div className="relative w-full h-[340px] sm:h-[380px]" style={{ perspective: '1200px' }}>
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
                    className="absolute inset-0 bg-bg-card border-2 border-border-light hover:border-primary/40 rounded-3xl shadow-md flex flex-col overflow-hidden transition-all duration-200"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    {/* Top Header Bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border-light bg-border-light/20">
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize border ${difficultyStyles[level]}`}>
                                {level}
                            </span>
                            {flashcard?.reviewCount > 0 && (
                                <span className="text-[11px] font-semibold text-text-muted bg-border-light px-2.5 py-0.5 rounded-full">
                                    Reviewed {flashcard.reviewCount}×
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {'speechSynthesis' in window && (
                                <button
                                    onClick={(e) => handleSpeak(e, flashcard?.question || '')}
                                    title="Read question out loud"
                                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-border-light/60 text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStar(flashcard._id);
                                }}
                                title={flashcard.isStarred ? 'Unstar flashcard' : 'Star flashcard'}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${flashcard.isStarred
                                        ? 'bg-amber-400 text-white shadow-sm shadow-amber-400/30'
                                        : 'bg-border-light text-text-muted hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-500'
                                    }`}
                            >
                                <Star className="w-4.5 h-4.5" strokeWidth={2} fill={flashcard.isStarred ? 'currentColor' : 'none'} />
                            </button>
                        </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Question</span>
                        <p className="text-lg sm:text-xl font-bold text-text-heading leading-relaxed max-w-xl">
                            {flashcard.question}
                        </p>
                    </div>

                    {/* Bottom Flip Bar */}
                    <div className="flex items-center justify-center gap-2 px-6 py-3.5 border-t border-border-light bg-border-light/30 text-text-muted text-xs font-semibold">
                        <RotateCcw className="w-4 h-4 text-primary animate-pulse" />
                        <span>Click or press <kbd className="px-1.5 py-0.5 bg-bg-card rounded border border-border-medium text-[10px]">Space</kbd> to reveal answer</span>
                    </div>
                </div>

                {/* Back of the card (Answer) */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-primary via-indigo-600 to-blue-700 text-white rounded-3xl shadow-xl flex flex-col overflow-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    {/* Top Header Bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-black/10 backdrop-blur-xs">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-white uppercase tracking-wider">
                            Answer
                        </span>
                        <div className="flex items-center gap-2">
                            {'speechSynthesis' in window && (
                                <button
                                    onClick={(e) => handleSpeak(e, flashcard?.answer || '')}
                                    title="Read answer out loud"
                                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/15 text-white/80 hover:text-white hover:bg-white/25 transition-colors"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStar(flashcard._id);
                                }}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${flashcard.isStarred
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'bg-white/15 text-white/70 hover:bg-white/25 hover:text-white'
                                    }`}
                            >
                                <Star className="w-4.5 h-4.5" strokeWidth={2} fill={flashcard.isStarred ? 'currentColor' : 'none'} />
                            </button>
                        </div>
                    </div>

                    {/* Answer Content */}
                    <div className="flex-1 flex items-center justify-center p-6 sm:p-8 text-center overflow-y-auto">
                        <p className="text-base sm:text-lg font-semibold text-white leading-relaxed max-w-xl">
                            {flashcard.answer}
                        </p>
                    </div>

                    {/* Self Rating Bar / Flip Back */}
                    <div className="px-6 py-3 border-t border-white/15 bg-black/20 backdrop-blur-xs flex items-center justify-between gap-3">
                        {onReview ? (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReview(flashcard._id, false);
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/15 hover:bg-rose-500 text-white text-xs font-bold transition-all"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>Needs Practice</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReview(flashcard._id, true);
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Got It Right!</span>
                                </button>
                            </>
                        ) : (
                            <div className="w-full flex items-center justify-center gap-2 text-xs font-medium text-white/80">
                                <RotateCcw className="w-4 h-4" />
                                <span>Click to flip back to question</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Flashcard;
