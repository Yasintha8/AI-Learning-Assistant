import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, SearchX, Trash2, X, BookOpen, Brain, Sparkles, Filter, Plus, ArrowRight } from "lucide-react";
import flashcardService from "../../services/flashcardService";
import Spinner from "../../components/common/Spinner";
import FlashcardSetCard from "../../components/flashcards/FlashcardSetCard";
import toast from '../../utils/toast';

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "most-cards", label: "Most Cards" },
  { value: "progress", label: "Highest Progress" },
];

const FILTER_TABS = [
  { id: "all", label: "All Decks" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Mastered / Done" },
  { id: "starred", label: "Has Starred ⭐" },
];

const getSetStats = (set) => {
  const cards = set.cards || [];
  const total = cards.length;
  const reviewed = cards.filter((card) => !!card.lastReviewed || card.reviewCount > 0).length;
  const starred = cards.filter((card) => card.isStarred).length;
  const pct = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  return { total, reviewed, starred, pct };
};

const FlashcardsListPage = () => {
  const navigate = useNavigate();
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [selectedSet, setSelectedSet] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFlashcardSets = async () => {
    try {
      const response = await flashcardService.getAllFlashcardSets();
      setFlashcardSets(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch flashcard sets.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      const { total, reviewed, starred, pct } = getSetStats(set);

      const matchesQuery = !query || set.documentId?.title?.toLowerCase().includes(query);

      let matchesStatus = true;
      if (statusFilter === "in-progress") matchesStatus = pct < 100;
      else if (statusFilter === "completed") matchesStatus = pct === 100 && total > 0;
      else if (statusFilter === "starred") matchesStatus = starred > 0;

      return matchesQuery && matchesStatus;
    });

    const sorted = [...filtered];
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "most-cards") {
      sorted.sort((a, b) => (b.cards?.length || 0) - (a.cards?.length || 0));
    } else if (sortBy === "progress") {
      sorted.sort((a, b) => getSetStats(b).pct - getSetStats(a).pct);
    }
    return sorted;
  }, [flashcardSets, searchQuery, statusFilter, sortBy]);

  // Total Metrics Calculations
  const totalDecks = flashcardSets.length;
  const totalCards = flashcardSets.reduce((sum, s) => sum + (s.cards?.length || 0), 0);
  const totalReviewed = flashcardSets.reduce((sum, s) => sum + (s.cards?.filter(c => !!c.lastReviewed || c.reviewCount > 0).length || 0), 0);
  const overallMasteryPct = totalCards > 0 ? Math.round((totalReviewed / totalCards) * 100) : 0;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  return (
    <div className="min-h-screen bg-bg-main pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-6">

        {/* Hero Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-500/10 via-primary/5 to-transparent border border-violet-500/15 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Active Memory Retention</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-text-heading tracking-tight">
                Flashcard Decks
              </h1>

              <p className="text-text-muted text-sm sm:text-base max-w-xl">
                Review and study AI-generated flashcard decks to boost long-term recall.
              </p>

              {/* Summary Stats Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-bg-card border border-border-light text-text-heading shadow-xs">
                  🎴 {totalDecks} Decks
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-bg-card border border-border-light text-text-heading shadow-xs">
                  ⚡ {totalCards} Cards
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-bg-card border border-border-light text-primary shadow-xs">
                  🎯 {overallMasteryPct}% Reviewed
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="shrink-0">
              <Link
                to="/documents"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20 cursor-pointer active:scale-98"
              >
                <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
                <span>Create New Deck</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Sort */}
        {flashcardSets.length > 0 && (
          <div className="bg-bg-card border border-border-light rounded-2xl p-4 shadow-sm space-y-4">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search flashcards by document title..."
                  className="w-full h-11 bg-bg-main border border-border-light rounded-xl pl-10 pr-9 text-sm text-text-heading placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-heading p-0.5 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto">
                <span className="text-xs font-semibold text-text-muted hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 px-3.5 rounded-xl border border-border-light bg-bg-main text-xs font-bold text-text-heading focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-border-light scrollbar-thin">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider shrink-0 pr-1">Filter:</span>
              {FILTER_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${statusFilter === t.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-bg-main border border-border-light text-text-muted hover:text-text-heading hover:bg-border-light/60'
                    }`}
                >
                  {t.label}
                </button>
              ))}

              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-600 px-2 py-1 shrink-0"
                >
                  Clear Filters
                </button>
              )}
            </div>

          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
            <Spinner label="Loading flashcard sets..." />
          </div>
        ) : flashcardSets.length === 0 ? (
          /* Empty State */
          <div className="bg-bg-card border border-border-light rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-heading">No Flashcard Decks Yet</h3>
              <p className="text-xs text-text-muted mt-1">
                Go to your uploaded documents to automatically generate interactive 3D flashcards.
              </p>
            </div>
            <button
              onClick={() => navigate("/documents")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Browse Documents</span>
            </button>
          </div>
        ) : filteredSets.length === 0 ? (
          /* No Filter Matches State */
          <div className="bg-bg-card border border-border-light rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-border-light flex items-center justify-center mx-auto">
              <SearchX className="w-7 h-7 text-text-muted" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-heading">No matching flashcard decks</h3>
              <p className="text-xs text-text-muted mt-1">
                Try clearing your search query or switching your status filter.
              </p>
            </div>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border-medium bg-bg-card text-xs font-bold text-text-heading hover:bg-border-light transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Flashcards Grid */
          <div className="space-y-4">
            <p className="text-xs font-semibold text-text-muted">
              Showing {filteredSets.length} of {flashcardSets.length} flashcard deck{flashcardSets.length === 1 ? "" : "s"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredSets.map((set) => (
                <FlashcardSetCard key={set._id} flashcardSet={set} onDelete={handleDeleteRequest} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-bg-card rounded-3xl shadow-xl border border-border-light p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-text-heading">Delete Flashcard Deck?</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Are you sure you want to delete the deck for <span className="font-bold text-text-heading">"{selectedSet?.documentId?.title || "this document"}"</span>? All cards will be permanently removed.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-border-medium bg-bg-card text-xs font-bold text-text-body hover:bg-border-light"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md"
              >
                {deleting ? "Deleting..." : "Delete Deck"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FlashcardsListPage;
