import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SearchX, Trash2, X } from "lucide-react";
import flashcardService from "../.././services/flashcardService";
import PageHeader from "../.././components/common/PageHeader";
import Spinner from "../.././components/common/Spinner";
import EmptyState from "../.././components/common/EmptyState";
import FlashcardSetCard from "../../components/flashcards/FlashcardSetCard";
import toast from '../../utils/toast';

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "most-cards", label: "Most Cards" },
  { value: "progress", label: "Progress" },
];

const selectClassName = "h-10 px-3 rounded-xl border border-border-medium bg-bg-card text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150 cursor-pointer";

const setProgress = (set) => {
  const totalCards = set.cards.length;
  const reviewedCount = set.cards.filter((card) => !!card.lastReviewed).length;
  return totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;
};

const FlashcardsListPage = () => {

  const navigate = useNavigate();
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [selectedSet, setSelectedSet] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchFlashcardSets = async () => {
      try {
        const response = await flashcardService.getAllFlashcardSets();
        setFlashcardSets(response.data);
      } catch (error) {
        toast.error('Failed to fetch flashcard sets.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchFlashcardSets();
  }, []);

  const handleDeleteRequest = (set) => {
    setSelectedSet(set);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSet) return;
    setDeleting(true);
    try {
      await flashcardService.deleteFlashcardSet(selectedSet._id);
      toast.success("Flashcard set deleted.");
      setIsDeleteModalOpen(false);
      setFlashcardSets((prev) => prev.filter((s) => s._id !== selectedSet._id));
      setSelectedSet(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete flashcard set.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredSets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = flashcardSets.filter((set) => {
      if (!query) return true;
      return set.documentId?.title?.toLowerCase().includes(query);
    });

    const sorted = [...filtered];
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "most-cards") {
      sorted.sort((a, b) => b.cards.length - a.cards.length);
    } else if (sortBy === "progress") {
      sorted.sort((a, b) => setProgress(b) - setProgress(a));
    }
    return sorted;
  }, [flashcardSets, searchQuery, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== "";

  const clearFilters = () => setSearchQuery("");

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-100">
          <Spinner />
        </div>
      )
    }

    if (flashcardSets.length === 0) {
      return (
        <EmptyState
          title="No Flashcard Sets Found"
          description="You haven't generated any flashcards yet. Go to a document to create your first flashcard set."
          buttonText="Browse Documents"
          onActionClick={() => navigate("/documents")}
        />
      );
    }

    if (filteredSets.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-border-light mb-5">
              <SearchX className="w-7 h-7 text-text-muted" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg text-text-heading font-bold tracking-tight mb-2">
              No matching flashcard sets
            </h3>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              Try adjusting your search to find what you're looking for.
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-medium bg-bg-card text-sm font-semibold text-text-body hover:bg-border-light transition-colors duration-150 cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-xs text-text-muted">
          Showing {filteredSets.length} of {flashcardSets.length} set{flashcardSets.length === 1 ? "" : "s"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSets.map((set) => (
            <FlashcardSetCard key={set._id} flashcardSet={set} onDelete={handleDeleteRequest} />
          ))}
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-bg-main">
      <div className="max-w-6xl mx-auto px-6 py-5 space-y-8">
        <PageHeader
          title="Flashcards"
          subtitle="Review and study your generated flashcard sets"
        />

        {/* Search / Sort Toolbar */}
        {flashcardSets.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by document title..."
                className="w-full h-10 bg-bg-card border border-border-medium rounded-xl pl-10 pr-4 text-sm text-text-heading placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={selectClassName}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="h-10 px-3 rounded-xl text-sm font-semibold text-primary hover:bg-primary-light transition-colors duration-150 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {renderContent()}
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-sm bg-bg-card rounded-2xl shadow-xl border border-border-light p-6 flex flex-col gap-5">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-body hover:bg-border-light transition-colors duration-150 cursor-pointer"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            <div className="flex flex-col items-center gap-3 pt-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-error-bg border border-error-border flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-error" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-bold text-text-heading tracking-tight">
                Delete Flashcard Set
              </h2>
            </div>

            <p className="text-sm text-text-muted text-center leading-relaxed">
              Are you sure you want to delete the flashcard set for{" "}
              <span className="font-semibold text-text-body">
                {selectedSet?.documentId?.title || "this document"}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex items-center gap-3 pt-1">
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
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlashcardsListPage;