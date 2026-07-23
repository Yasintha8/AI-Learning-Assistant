import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import toast from '../../utils/toast';

import flashcardService from "../../services/flashcardService";
import aiService from "../../services/aiService";
import PageHeader from "../../components/common/PageHeader";
import Spinner from "../../components/common/Spinner";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Flashcard from "../../components/flashcards/Flashcard";

const FlashcardPage = () => {

  const { id: documentId } = useParams();

  const [flashcardSets, setFlashcardSets] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFlashcards = async () => {
    setLoading(true);
    try {
      const response = await flashcardService.getFlashcardsForDocument(
        documentId
      );

      setFlashcardSets(response.data[0]);
      setFlashcards(response.data[0]?.cards || []);
    } catch (error) {
      toast.error("Failed to fetch flashcards.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [documentId]);

  const handleGenerateFlashcards = async () => {
    setGenerating(true);
    try {
      await aiService.generateFlashcards(documentId);
      toast.success("Flashcards generated successfully!");
      fetchFlashcards();
    } catch (error) {
      toast.error(error.message || "Failed to generate flashcards.");
    } finally {
      setGenerating(false);
    }
  };

  const handleNextCard = () => {
    handleReview(currentCardIndex)
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const handlePrevCard = () => {
    handleReview(currentCardIndex)
    setCurrentCardIndex(
      (prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length
    );
  };

  const handleReview = async (index) => {
    const currentCard = flashcards[currentCardIndex];
    if (!currentCard) return;

    try {
      const response = await flashcardService.reviewFlashcard(currentCard._id, index);
      toast.success(
        response.masteryUpdated ? "Flashcard reviewed! Mastery updated." : "Flashcard reviewed!",
        response.masteryUpdated ? { icon: '🎯' } : undefined
      );
    } catch (error) {
      toast.error("Failed to review flashcard.");
    }
  };

  const handleToggleStar = async (cardId) => {
    try {
      await flashcardService.toggleStar(cardId);
      setFlashcards((prevFlashcards) =>
        prevFlashcards.map((card) =>
          card._id === cardId ? { ...card, isStarred: !card.isStarred } : card
        )
      );
      toast.success("Flashcard starred status updated!");
    } catch (error) {
      toast.error("Failed to update star status.");
    }
  };

  const handleDeleteFlashcardSet = async () => {
    setDeleting(true);
    try {
      await flashcardService.deleteFlashcardSet(flashcardSets._id);
      toast.success("Flashcard set deleted successfully!");
      setIsDeleteModalOpen(false);
      fetchFlashcards(); // Refetch to show empty state
    } catch (error) {
      toast.error(error.message || "Failed to delete flashcard set.");
    } finally {
      setDeleting(false);
    }
  };

  const renderFlashcardContent = () => {
    if (loading) {
      return <Spinner />;
    }

    if (flashcards.length === 0) {
      return (
        <EmptyState
          title="No Flashcards Yet"
          description="Generate flashcards from your document to start learning."
        />
      );
    }

    const currentCard = flashcards[currentCardIndex];

    return (
      <div className="flex flex-col items-center gap-6 p-6 max-w-2xl mx-auto">
        {/* Flashcard Wrapper Container */}
        <div className="w-full bg-bg-card border border-border-light rounded-2xl shadow-sm transition-all duration-300">
          <Flashcard flashcard={currentCard} onToggleStar={handleToggleStar} />
        </div>

        {/* Navigation Controls Bar */}
        <div className="flex items-center justify-between w-full md:w-3/4 gap-4 px-2">
          <Button
            onClick={handlePrevCard}
            variant="secondary"
            disabled={flashcards.length <= 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-medium bg-bg-card font-body font-medium text-text-body hover:bg-border-light disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} className="text-text-muted" /> Previous
          </Button>

          {/* Counter Text */}
          <span className="font-display font-semibold text-lg text-text-heading tracking-wide">
            {currentCardIndex + 1} <span className="text-text-muted font-normal mx-0.5">/</span> {flashcards.length}
          </span>

          <Button
            onClick={handleNextCard}
            variant="secondary"
            disabled={flashcards.length <= 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-medium bg-bg-card font-body font-medium text-text-body hover:bg-border-light disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight size={16} className="text-text-muted" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center mb-4">
        <Link
          to={`/documents/${documentId}`}
          className="inline-flex items-center gap-2 font-body font-medium text-sm text-text-muted hover:text-primary transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Back to Document
        </Link>
      </div>

      {/* Header Section with Actions */}
      <PageHeader title="Flashcards" className="border-b border-border-light pb-4">
        <div className="flex items-center gap-3">
          {!loading &&
            (flashcards.length > 0 ? (
              <>
                <Button
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={deleting}
                  variant="primary"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-error-border bg-error-bg font-body font-medium text-sm text-error hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Trash2 size={16} /> Delete Set
                </Button>
              </>
            ) : (
              <Button
                onClick={handleGenerateFlashcards}
                disabled={generating || loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-body font-medium text-sm hover:bg-primary-hover shadow-sm shadow-primary-shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {generating ? (
                  <Spinner size="sm" tone="white" inline />
                ) : (
                  <>
                    <Plus size={16} /> Generate Flashcards
                  </>
                )}
              </Button>
            ))}
        </div>
      </PageHeader>

      {/* Content Wrapper */}
      <div className="w-full rounded-2xl animate-fade-in">
        {renderFlashcardContent()}
      </div>

      {/* Delete Confirmation Modal Overlay */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Flashcard Set"
      >
        <div className="space-y-6 p-1 animate-fade-in">
          <p className="font-body text-base text-text-body leading-relaxed">
            Are you sure you want to delete all flashcards for this document?{" "}
            <span className="text-error font-medium">This action cannot be undone.</span>
          </p>

          {/* Modal Action Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-light">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
              className="px-4 py-2 rounded-xl border border-border-medium bg-bg-card font-body font-medium text-sm text-text-body hover:bg-border-light disabled:opacity-40 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteFlashcardSet}
              disabled={deleting}
              className="px-5 py-2 rounded-xl bg-error text-white font-body font-medium text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FlashcardPage;