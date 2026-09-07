import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Shuffle,
  Star,
  Grid,
  Layers,
  Sparkles,
  RotateCcw,
  Award,
  Keyboard,
  Brain
} from "lucide-react";
import toast from '../../utils/toast';

import flashcardService from "../../services/flashcardService";
import documentService from "../../services/documentService";
import aiService from "../../services/aiService";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";
import Flashcard from "../../components/flashcards/Flashcard";

const FlashcardPage = () => {
  const { id: documentId } = useParams();
  const navigate = useNavigate();

  const [documentDetails, setDocumentDetails] = useState(null);
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Custom Controls State
  const [viewMode, setViewMode] = useState('study'); // 'study' | 'grid'
  const [starredOnly, setStarredOnly] = useState(false);
  const [isDeckCompleted, setIsDeckCompleted] = useState(false);

  const fetchDocumentAndFlashcards = async () => {
    setLoading(true);
    try {
      // Fetch document details for breadcrumbs & title
      const [docRes, flashRes] = await Promise.allSettled([
        documentService.getDocumentById(documentId),
        flashcardService.getFlashcardsForDocument(documentId)
      ]);

      if (docRes.status === 'fulfilled') {
        setDocumentDetails(docRes.value.data || docRes.value);
      }

      if (flashRes.status === 'fulfilled') {
        const setObj = flashRes.value.data?.[0] || null;
        setFlashcardSet(setObj);
        setCards(setObj?.cards || []);
      }
    } catch (error) {
      toast.error("Failed to fetch flashcards.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentAndFlashcards();
  }, [documentId]);

  // Derived filtered cards (e.g. Starred Only)
  const displayCards = starredOnly ? cards.filter(c => c.isStarred) : cards;

  // Handle deck completion detection
  useEffect(() => {
    if (currentCardIndex >= displayCards.length && displayCards.length > 0) {
      setCurrentCardIndex(displayCards.length - 1);
    }
  }, [displayCards.length, currentCardIndex]);

  const handleGenerateFlashcards = async () => {
    setGenerating(true);
    try {
      await aiService.generateFlashcards(documentId);
      toast.success("Flashcards generated successfully!");
      fetchDocumentAndFlashcards();
    } catch (error) {
      toast.error(error.message || "Failed to generate flashcards.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReviewCard = async (cardId, isCorrect) => {
    try {
      const response = await flashcardService.reviewFlashcard(cardId, currentCardIndex);
      toast.success(
        isCorrect ? "Great job! Card reviewed ✅" : "Card marked for practice 📖",
        { icon: isCorrect ? '🎯' : '💡' }
      );

      // Advance to next card if available, else show deck complete
      if (currentCardIndex < displayCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
      } else {
        setIsDeckCompleted(true);
      }
    } catch (error) {
      console.error("Failed to review flashcard:", error);
    }
  };

  const handleNextCard = () => {
    if (displayCards.length === 0) return;
    if (currentCardIndex < displayCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setIsDeckCompleted(true);
    }
  };

  const handlePrevCard = () => {
    if (displayCards.length === 0) return;
    setCurrentCardIndex(prev => (prev - 1 + displayCards.length) % displayCards.length);
  };

  const handleShuffleDeck = () => {
    if (cards.length <= 1) return;
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentCardIndex(0);
    toast.success("Deck shuffled! 🔀");
  };

  const handleToggleStar = async (cardId) => {
    try {
      await flashcardService.toggleStar(cardId);
      setCards(prevCards =>
        prevCards.map(card =>
          card._id === cardId ? { ...card, isStarred: !card.isStarred } : card
        )
      );
      toast.success("Flashcard starred status updated!");
    } catch (error) {
      toast.error("Failed to update star status.");
    }
  };

  const handleDeleteFlashcardSet = async () => {
    if (!flashcardSet?._id) return;
    setDeleting(true);
    try {
      await flashcardService.deleteFlashcardSet(flashcardSet._id);
      toast.success("Flashcard set deleted successfully!");
      setIsDeleteModalOpen(false);
      fetchDocumentAndFlashcards();
    } catch (error) {
      toast.error(error.message || "Failed to delete flashcard set.");
    } finally {
      setDeleting(false);
    }
  };

  // Keyboard Shortcuts Listener
  const handleKeyDown = useCallback(
    (e) => {
      // Ignore if modal is open or user is typing in input
      if (isDeleteModalOpen || isKeyboardModalOpen) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        const activeCard = displayCards[currentCardIndex];
        if (activeCard) handleToggleStar(activeCard._id);
      }
    },
    [currentCardIndex, displayCards, isDeleteModalOpen, isKeyboardModalOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const reviewedCount = cards.filter(c => c.reviewCount > 0).length;
  const starredCount = cards.filter(c => c.isStarred).length;
  const progressPct = cards.length > 0 ? Math.round((reviewedCount / cards.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-bg-main pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-6">

        {/* Top Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-4 text-xs font-semibold text-text-muted">
          <div className="flex items-center gap-2 truncate">
            <Link
              to="/documents"
              className="hover:text-primary transition-colors truncate"
            >
              Documents
            </Link>
            <span>/</span>
            <Link
              to={`/documents/${documentId}`}
              className="hover:text-primary transition-colors truncate max-w-[200px]"
            >
              {documentDetails?.title || 'Document'}
            </Link>
            <span>/</span>
            <span className="text-text-heading font-bold">Flashcards</span>
          </div>

          <button
            onClick={() => setIsKeyboardModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-light bg-bg-card hover:bg-border-light text-text-muted hover:text-text-heading transition-colors"
          >
            <Keyboard className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Shortcuts</span>
          </button>
        </div>

        {/* Header Title Banner */}
        <div className="bg-bg-card border border-border-light rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <Brain className="w-3.5 h-3.5" />
              <span>Interactive Active Recall</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-heading tracking-tight">
              {documentDetails?.title ? `${documentDetails.title} · Flashcards` : 'Document Flashcards'}
            </h1>

            <p className="text-text-muted text-sm max-w-xl">
              Master concepts quickly with 3D active-recall flashcards generated by AI.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!loading && cards.length > 0 && (
              <>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                >
                  {generating ? <Spinner size="sm" tone="white" inline /> : <Plus className="w-4 h-4" />}
                  <span>Generate New Set</span>
                </button>

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete Set</span>
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
            <Spinner label="Loading flashcard deck..." />
          </div>
        ) : cards.length === 0 ? (
          /* Empty Deck State */
          <div className="bg-bg-card border border-border-light rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-heading">No Flashcards Available</h3>
              <p className="text-xs text-text-muted mt-1">
                Generate flashcards automatically from your document content using AI.
              </p>
            </div>
            <button
              onClick={handleGenerateFlashcards}
              disabled={generating}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
            >
              {generating ? <Spinner size="sm" tone="white" inline /> : <Sparkles className="w-4.5 h-4.5" />}
              <span>{generating ? 'Generating Flashcards...' : 'Generate Flashcards Now'}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Deck Stats & Toolbar Bar */}
            <div className="bg-bg-card border border-border-light rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                {/* Deck progress summary */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Deck Progress</span>
                      <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                        {progressPct}% Mastered
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-text-heading">
                      {reviewedCount} of {cards.length} cards reviewed · {starredCount} starred ⭐
                    </p>
                  </div>
                </div>

                {/* Toolbar controls */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {/* View Mode Toggle */}
                  <div className="flex items-center p-1 bg-border-light rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setViewMode('study')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'study' ? 'bg-bg-card text-primary shadow-xs' : 'text-text-muted hover:text-text-heading'
                        }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Study Stack</span>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-bg-card text-primary shadow-xs' : 'text-text-muted hover:text-text-heading'
                        }`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                      <span>Grid View</span>
                    </button>
                  </div>

                  {/* Starred Filter Toggle */}
                  <button
                    onClick={() => {
                      setStarredOnly(!starredOnly);
                      setCurrentCardIndex(0);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${starredOnly
                        ? 'bg-amber-400 text-white border-amber-400 shadow-sm'
                        : 'bg-bg-card border-border-light text-text-muted hover:text-amber-500 hover:border-amber-200'
                      }`}
                  >
                    <Star className="w-3.5 h-3.5" fill={starredOnly ? 'currentColor' : 'none'} />
                    <span>Starred Only</span>
                  </button>

                  {/* Shuffle Button */}
                  <button
                    onClick={handleShuffleDeck}
                    title="Shuffle Deck"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-card border border-border-light text-text-muted hover:text-primary hover:bg-primary/5 text-xs font-bold transition-all"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Shuffle</span>
                  </button>
                </div>
              </div>

              {/* Progress bar line */}
              <div className="w-full h-2 rounded-full bg-border-light overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Main Flashcard Content View */}
            {viewMode === 'study' ? (
              isDeckCompleted ? (
                /* Deck Completion Summary Screen */
                <div className="bg-bg-card border border-border-light rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-md animate-fade-in">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
                    <Award className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-text-heading">Deck Completed! 🎉</h2>
                    <p className="text-text-muted text-sm">
                      You have gone through all cards in this flashcard deck. Active recall boosts memory retention!
                    </p>
                  </div>

                  {/* Stats breakdown */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-border-light/40 rounded-2xl border border-border-light text-center">
                    <div>
                      <span className="text-2xl font-bold text-text-heading">{displayCards.length}</span>
                      <p className="text-[11px] font-semibold text-text-muted">Total Cards</p>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-emerald-500">{reviewedCount}</span>
                      <p className="text-[11px] font-semibold text-text-muted">Reviewed</p>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-amber-500">{starredCount}</span>
                      <p className="text-[11px] font-semibold text-text-muted">Starred</p>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setCurrentCardIndex(0);
                        setIsDeckCompleted(false);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all shadow-md"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restart Deck</span>
                    </button>
                    {starredCount > 0 && (
                      <button
                        onClick={() => {
                          setStarredOnly(true);
                          setCurrentCardIndex(0);
                          setIsDeckCompleted(false);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-white text-xs font-bold hover:bg-amber-500 transition-all"
                      >
                        <Star className="w-4 h-4" fill="currentColor" />
                        <span>Study Starred Only ({starredCount})</span>
                      </button>
                    )}
                    <Link
                      to={`/documents/${documentId}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-medium bg-bg-card text-text-heading text-xs font-bold hover:bg-border-light transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Document</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* 3D Study Stack View */
                <div className="space-y-6">
                  {/* Card Container */}
                  <div className="max-w-2xl mx-auto">
                    {displayCards[currentCardIndex] ? (
                      <Flashcard
                        flashcard={displayCards[currentCardIndex]}
                        onToggleStar={handleToggleStar}
                        onReview={(cardId, isCorrect) => handleReviewCard(cardId, isCorrect)}
                      />
                    ) : (
                      <div className="p-8 text-center text-text-muted">No cards found for this filter.</div>
                    )}
                  </div>

                  {/* Navigation Controls Bar */}
                  <div className="flex items-center justify-between max-w-2xl mx-auto gap-4 px-2">
                    <button
                      onClick={handlePrevCard}
                      disabled={displayCards.length <= 1}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-bg-card border border-border-medium text-text-heading text-xs font-bold hover:bg-border-light disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    {/* Position indicator */}
                    <div className="flex items-center gap-2 bg-bg-card border border-border-light px-4 py-2 rounded-2xl shadow-xs text-xs font-extrabold text-text-heading">
                      <span>Card {currentCardIndex + 1}</span>
                      <span className="text-text-muted">of</span>
                      <span>{displayCards.length}</span>
                    </div>

                    <button
                      onClick={handleNextCard}
                      disabled={displayCards.length <= 1}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Horizontal Quick Jump Card Strip */}
                  <div className="max-w-2xl mx-auto bg-bg-card border border-border-light rounded-2xl p-3 shadow-xs">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                      {displayCards.map((card, idx) => {
                        const isActive = idx === currentCardIndex;
                        const isReviewed = card.reviewCount > 0;

                        return (
                          <button
                            key={card._id || idx}
                            onClick={() => {
                              setCurrentCardIndex(idx);
                              setIsDeckCompleted(false);
                            }}
                            className={`shrink-0 w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative ${isActive
                                ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                                : isReviewed
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                  : 'bg-border-light text-text-muted hover:bg-border-medium hover:text-text-heading'
                              }`}
                          >
                            <span>{idx + 1}</span>
                            {card.isStarred && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* Multi-Card Grid View Mode */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayCards.map((card, index) => (
                  <div
                    key={card._id || index}
                    className="bg-bg-card border border-border-light hover:border-primary/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-text-muted bg-border-light px-2.5 py-1 rounded-lg">
                        Card #{index + 1}
                      </span>
                      <button
                        onClick={() => handleToggleStar(card._id)}
                        className={`p-1.5 rounded-lg transition-colors ${card.isStarred ? 'text-amber-400' : 'text-text-muted hover:text-amber-400'
                          }`}
                      >
                        <Star className="w-4 h-4" fill={card.isStarred ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Question</span>
                        <p className="text-sm font-bold text-text-heading mt-0.5 leading-snug">{card.question}</p>
                      </div>
                      <div className="pt-2 border-t border-border-light">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Answer</span>
                        <p className="text-xs font-medium text-text-body mt-0.5 leading-relaxed">{card.answer}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-text-muted capitalize">
                        Difficulty: {card.difficulty || 'Medium'}
                      </span>
                      <button
                        onClick={() => {
                          setCurrentCardIndex(index);
                          setViewMode('study');
                          setIsDeckCompleted(false);
                        }}
                        className="text-xs font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1"
                      >
                        <span>Study Card</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Flashcard Set"
      >
        <div className="space-y-5 p-1">
          <p className="text-sm text-text-body leading-relaxed">
            Are you sure you want to delete all flashcards for this document?{" "}
            <span className="text-rose-500 font-bold">This action cannot be undone.</span>
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-light">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
              className="px-4 py-2 rounded-xl border border-border-medium bg-bg-card text-xs font-bold text-text-body hover:bg-border-light"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteFlashcardSet}
              disabled={deleting}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
            >
              {deleting ? "Deleting..." : "Delete Set"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Keyboard Shortcuts Guide Modal */}
      <Modal
        isOpen={isKeyboardModalOpen}
        onClose={() => setIsKeyboardModalOpen(false)}
        title="Keyboard Shortcuts Guide ⌨️"
      >
        <div className="space-y-4 p-1">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-border-light/40 rounded-xl">
              <span className="font-semibold text-text-heading">Flip Flashcard</span>
              <kbd className="px-2 py-1 bg-bg-card rounded border border-border-medium font-mono font-bold text-text-heading">Space</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-border-light/40 rounded-xl">
              <span className="font-semibold text-text-heading">Next Flashcard</span>
              <kbd className="px-2 py-1 bg-bg-card rounded border border-border-medium font-mono font-bold text-text-heading">→</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-border-light/40 rounded-xl">
              <span className="font-semibold text-text-heading">Previous Flashcard</span>
              <kbd className="px-2 py-1 bg-bg-card rounded border border-border-medium font-mono font-bold text-text-heading">←</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-border-light/40 rounded-xl">
              <span className="font-semibold text-text-heading">Toggle Star Status</span>
              <kbd className="px-2 py-1 bg-bg-card rounded border border-border-medium font-mono font-bold text-text-heading">S</kbd>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsKeyboardModalOpen(false)}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
            >
              Got it!
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default FlashcardPage;