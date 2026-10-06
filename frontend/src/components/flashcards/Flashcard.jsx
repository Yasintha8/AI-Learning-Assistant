import { useState, useEffect, useRef } from "react";
import { Star, RotateCcw, CheckCircle, XCircle, Volume2, VolumeX, Smartphone } from "lucide-react";

const Flashcard = ({
    flashcard,
    onToggleStar,
    onReview,
    isFlipped: controlledFlipped,
    onFlip,
    isSpeaking: controlledSpeaking,
    onToggleSpeak: controlledToggleSpeak,
    onNext,
    onPrev,
}) => {
    const [internalFlipped, setInternalFlipped] = useState(false);
    const [internalSpeaking, setInternalSpeaking] = useState(false);

    // Touch gesture tracking for mobile swipe navigation
    const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
    const swipedRef = useRef(false);

    const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
    const isSpeaking = controlledSpeaking !== undefined ? controlledSpeaking : internalSpeaking;

    const handleFlip = () => {
        // If user just performed a swipe gesture, ignore the synthetic click
        if (swipedRef.current) {
            swipedRef.current = false;
            return;
        }

        // Stop audio when flipping
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            if (controlledToggleSpeak) {
                // let parent handle if needed
            } else {
                setInternalSpeaking(false);
            }
        }

        if (onFlip) {
            onFlip(!isFlipped);
        } else {
            setInternalFlipped(!isFlipped);
        }
    };

    const handleTouchStart = (e) => {
        if (e.touches && e.touches.length === 1) {
            touchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now()
            };
            swipedRef.current = false;
        }
    };

    const handleTouchEnd = (e) => {
        if (!touchStartRef.current.time) return;
        const touch = e.changedTouches?.[0];
        if (!touch) return;

        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const timeDiff = Date.now() - touchStartRef.current.time;

        const minSwipeDistance = 45;
        // Check if fast/clear horizontal swipe
        if (
            Math.abs(deltaX) > minSwipeDistance &&
            Math.abs(deltaX) > Math.abs(deltaY) * 1.3 &&
            timeDiff < 500
        ) {
            swipedRef.current = true;
            if (deltaX < 0) {
                // Swiped Left -> Go to Next
                if (onNext) onNext();
            } else {
                // Swiped Right -> Go to Prev
                if (onPrev) onPrev();
            }
        }
        touchStartRef.current = { x: 0, y: 0, time: 0 };
    };

    const handleSpeakInternal = (e, text) => {
        e?.stopPropagation();
        if (controlledToggleSpeak) {
            controlledToggleSpeak(e, text);
            return;
        }

        if (!('speechSynthesis' in window)) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setInternalSpeaking(false);
            return;
        }

        window.speechSynthesis.cancel();
        const cleanText = (text || '').replace(/[*_#`]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onstart = () => setInternalSpeaking(true);
        utterance.onend = () => setInternalSpeaking(false);
        utterance.onerror = () => setInternalSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    // Reset flip state and cancel speech whenever the card changes or unmounts
    useEffect(() => {
        setInternalFlipped(false);
        setInternalSpeaking(false);
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [flashcard?._id]);

    const difficultyStyles = {
        easy: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
        medium: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400',
        hard: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400',
    };

    const level = flashcard?.difficulty ?? 'medium';

    return (
        <div className="relative w-full h-85 sm:h-95 font-body" style={{ perspective: '1200px' }}>
            <div
                className="relative w-full h-full transition-transform duration-500 transform-gpu cursor-pointer select-none touch-pan-y"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
                onClick={handleFlip}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
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
                                <span className="text-[11px] font-semibold text-text-muted bg-border-light px-2.5 py-0.5 rounded-full font-mono">
                                    Reviewed {flashcard.reviewCount}×
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {'speechSynthesis' in window && (
                                <button
                                    type="button"
                                    onClick={(e) => handleSpeakInternal(e, flashcard?.question || '')}
                                    title={isSpeaking ? 'Stop reading out loud (Press A)' : 'Read question out loud (Press A)'}
                                    className={`h-9 px-2.5 rounded-xl flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                                        isSpeaking
                                            ? 'bg-primary text-white shadow-sm ring-2 ring-primary ring-offset-2 ring-offset-bg-card animate-pulse'
                                            : 'bg-border-light/60 text-text-muted hover:text-primary hover:bg-primary/10'
                                    }`}
                                >
                                    {isSpeaking ? (
                                        <VolumeX className="w-4 h-4" />
                                    ) : (
                                        <Volume2 className="w-4 h-4" />
                                    )}
                                    <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-bg-card/80 text-[10px] font-mono font-bold border border-border-medium/60">
                                        A
                                    </kbd>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStar(flashcard._id);
                                }}
                                title={flashcard.isStarred ? 'Unstar flashcard (Press S)' : 'Star flashcard (Press S)'}
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
                        <span className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 font-mono">Question</span>
                        <p className="text-lg sm:text-xl font-bold text-text-heading leading-relaxed max-w-xl">
                            {flashcard.question}
                        </p>
                    </div>

                    {/* Bottom Flip Bar */}
                    <div className="flex items-center justify-center gap-2 px-6 py-3.5 border-t border-border-light bg-border-light/30 text-text-muted text-xs font-semibold">
                        <RotateCcw className="w-4 h-4 text-primary animate-pulse" />
                        <span>Click or swipe <span className="font-bold text-text-heading">↔</span> · Press <kbd className="px-1.5 py-0.5 bg-bg-card rounded border border-border-medium text-[10px] font-mono">Space</kbd> to reveal</span>
                    </div>
                </div>

                {/* Back of the card (Answer) */}
                <div
                    className="absolute inset-0 bg-linear-to-br from-primary via-indigo-600 to-blue-700 text-white rounded-3xl shadow-xl flex flex-col overflow-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    {/* Top Header Bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-black/10 backdrop-blur-xs">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-white uppercase tracking-wider font-mono">
                            Answer
                        </span>
                        <div className="flex items-center gap-2">
                            {'speechSynthesis' in window && (
                                <button
                                    type="button"
                                    onClick={(e) => handleSpeakInternal(e, flashcard?.answer || '')}
                                    title={isSpeaking ? 'Stop reading out loud (Press A)' : 'Read answer out loud (Press A)'}
                                    className={`h-9 px-2.5 rounded-xl flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                                        isSpeaking
                                            ? 'bg-white text-primary shadow-sm ring-2 ring-white ring-offset-2 ring-offset-primary animate-pulse font-bold'
                                            : 'bg-white/15 text-white/80 hover:text-white hover:bg-white/25'
                                    }`}
                                >
                                    {isSpeaking ? (
                                        <VolumeX className="w-4 h-4" />
                                    ) : (
                                        <Volume2 className="w-4 h-4" />
                                    )}
                                    <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-black/20 text-[10px] font-mono font-bold text-white border border-white/20">
                                        A
                                    </kbd>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStar(flashcard._id);
                                }}
                                title="Star / Unstar flashcard (Press S)"
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
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReview(flashcard._id, false);
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/15 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>Needs Practice</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReview(flashcard._id, true);
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Got It Right!</span>
                                </button>
                            </>
                        ) : (
                            <div className="w-full flex items-center justify-center gap-2 text-xs font-medium text-white/80">
                                <RotateCcw className="w-4 h-4" />
                                <span>Click or swipe <span className="font-bold text-white">↔</span> · Press <kbd className="px-1.5 py-0.5 bg-black/30 rounded border border-white/20 text-[10px] font-mono">Space</kbd> to flip back</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Flashcard;
