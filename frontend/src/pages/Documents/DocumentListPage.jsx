import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Upload, Trash2, FileText, X, Link2, Search, SearchX, Grid, List,
  Presentation, Video, Globe, Clock, Target, ArrowRight, Sparkles, Filter
} from "lucide-react";
import toast from '../../utils/toast';
import documentService from "../../services/documentService";
import Spinner from "../../components/common/Spinner";
import Button from "../../components/common/Button";
import DocumentCard from "../../components/documents/DocumentCard";
import { getProgressBandStyle } from '../../utils/learningPathStatus';
import moment from "moment";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name", label: "Name (A–Z)" },
];

const FILE_TYPES = [
  { id: 'all', label: 'All Files' },
  { id: 'pdf', label: 'PDFs' },
  { id: 'docx', label: 'DOCX' },
  { id: 'pptx', label: 'PPTX' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'website', label: 'Websites' },
];

const DocumentListPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search / filter / sort / layout state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [layoutMode, setLayoutMode] = useState("grid"); // 'grid' | 'list'

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState("file"); // 'file' | 'link'
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchDocuments = async () => {
    try {
      const data = await documentService.getDocuments();
      setDocuments(data || []);
    } catch (error) {
      toast.error("Failed to fetch documents.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadMode("file");
    setUploadFile(null);
    setUploadTitle("");
    setLinkUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploadMode === "link") {
      if (!linkUrl || !uploadTitle) {
        toast.error("Please provide a title and a URL.");
        return;
      }
      setUploading(true);
      try {
        await documentService.addDocumentFromUrl({ url: linkUrl, title: uploadTitle });
        toast.success("Document added successfully!");
        closeUploadModal();
        setLoading(true);
        fetchDocuments();
      } catch (error) {
        toast.error(error.message || "Failed to add document from link.");
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!uploadFile || !uploadTitle) {
      toast.error("Please provide a title and select a file.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle);

    try {
      await documentService.uploadDocument(formData);
      toast.success("Document uploaded successfully!");
      closeUploadModal();
      setLoading(true);
      fetchDocuments();
    } catch (error) {
      toast.error(error.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRequest = (doc) => {
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;
    setDeleting(true);
    try {
      await documentService.deleteDocument(selectedDoc._id);
      toast.success(`'${selectedDoc.title}' deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedDoc(null);
      setDocuments(documents.filter((d) => d._id !== selectedDoc._id));
    } catch (error) {
      toast.error(error.message || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = documents.filter((doc) => {
      const matchesQuery = !query || doc.title?.toLowerCase().includes(query);
      const matchesType = typeFilter === "all" || doc.fileType === typeFilter;
      return matchesQuery && matchesType;
    });

    const sorted = [...filtered];
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt || b.uploadDate || 0) - new Date(a.createdAt || a.uploadDate || 0));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a.createdAt || a.uploadDate || 0) - new Date(b.createdAt || b.uploadDate || 0));
    } else if (sortBy === "name") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return sorted;
  }, [documents, searchQuery, typeFilter, sortBy]);

  const fileCount = documents.filter(d => ['pdf', 'docx', 'pptx'].includes(d.fileType)).length;
  const linkCount = documents.filter(d => ['youtube', 'website'].includes(d.fileType)).length;

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  return (
    <div className="min-h-screen bg-bg-main pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-6">

        {/* Page Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <FileText className="w-3.5 h-3.5" />
                <span>Document Knowledge Base</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-text-heading tracking-tight">
                My Documents
              </h1>

              <p className="text-text-muted text-sm sm:text-base max-w-xl">
                Upload PDFs, notes, YouTube videos, or articles to generate interactive AI study paths.
              </p>

              {/* Summary Stats Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-bg-card border border-border-light text-text-heading shadow-xs">
                  📁 {documents.length} Total
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-bg-card border border-border-light text-text-heading shadow-xs">
                  📄 {fileCount} Files
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-bg-card border border-border-light text-text-heading shadow-xs">
                  🔗 {linkCount} Web Links
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="shrink-0">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20 cursor-pointer active:scale-98"
              >
                <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
                <span>Upload Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar Bar: Search, Type Tabs, Sort, View Switcher */}
        {documents.length > 0 && (
          <div className="bg-bg-card border border-border-light rounded-2xl p-4 shadow-sm space-y-4">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents by title..."
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

              {/* Sort + Layout Toggle */}
              <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
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

                {/* View Mode Toggle */}
                <div className="flex items-center p-1 bg-bg-main border border-border-light rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setLayoutMode("grid")}
                    title="Grid View"
                    className={`p-2 rounded-lg transition-colors ${layoutMode === "grid" ? "bg-bg-card text-primary shadow-xs" : "text-text-muted hover:text-text-heading"
                      }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLayoutMode("list")}
                    title="List View"
                    className={`p-2 rounded-lg transition-colors ${layoutMode === "list" ? "bg-bg-card text-primary shadow-xs" : "text-text-muted hover:text-text-heading"
                      }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Type Filter Pills Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-border-light scrollbar-thin">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider shrink-0 pr-1">Filter:</span>
              {FILE_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${typeFilter === t.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-bg-main border border-border-light text-text-muted hover:text-text-heading hover:bg-border-light/60'
                    }`}
                >
                  {t.label}
                </button>
              ))}

              {(searchQuery || typeFilter !== 'all') && (
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

        {/* Content Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
            <Spinner label="Loading documents..." />
          </div>
        ) : documents.length === 0 ? (
          /* Empty Documents State */
          <div className="bg-bg-card border border-border-light rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-heading">No Documents Uploaded</h3>
              <p className="text-xs text-text-muted mt-1">
                Upload your first PDF, DOCX, PPTX, or paste a video link to start creating AI learning paths.
              </p>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          /* No Matches State */
          <div className="bg-bg-card border border-border-light rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-border-light flex items-center justify-center mx-auto">
              <SearchX className="w-7 h-7 text-text-muted" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-heading">No matching documents found</h3>
              <p className="text-xs text-text-muted mt-1">
                Try searching for a different keyword or resetting your filter criteria.
              </p>
            </div>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border-medium bg-bg-card text-xs font-bold text-text-heading hover:bg-border-light transition-colors"
            >
              Clear Search & Filters
            </button>
          </div>
        ) : (
          /* Documents List / Grid */
          <div className="space-y-4">
            <p className="text-xs font-semibold text-text-muted">
              Showing {filteredDocuments.length} of {documents.length} document{documents.length === 1 ? "" : "s"}
            </p>

            {layoutMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc._id}
                    document={doc}
                    onDelete={handleDeleteRequest}
                  />
                ))}
              </div>
            ) : (
              /* Compact List View Mode */
              <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-xs divide-y divide-border-light">
                {filteredDocuments.map((doc) => {
                  const progress = doc.learningPathProgress || 0;
                  const band = getProgressBandStyle(progress);

                  return (
                    <div
                      key={doc._id}
                      onClick={() => navigate(`/documents/${doc._id}`)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-border-light/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-text-heading group-hover:text-primary transition-colors truncate">
                              {doc.title}
                            </h4>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-border-light text-text-muted shrink-0">
                              {doc.fileType || 'PDF'}
                            </span>
                          </div>

                          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
                            <span>Uploaded {moment(doc.createdAt || doc.uploadDate).fromNow()}</span>
                            {doc.flashcardCount > 0 && (
                              <>
                                <span>·</span>
                                <span>{doc.flashcardCount} cards</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar in list */}
                      <div className="w-full sm:w-44 shrink-0 space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-text-muted">Mastery</span>
                          <span className={`tabular-nums font-bold ${band.text}`}>{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${band.bar} transition-all duration-300`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRequest(doc);
                          }}
                          className="p-2 rounded-xl text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover">
                          <span>Study</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Upload Document Modal Overlay */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-bg-card rounded-3xl shadow-xl border border-border-light p-6 sm:p-8 flex flex-col gap-6">

            {/* Close button */}
            <button
              onClick={closeUploadModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-heading hover:bg-border-light transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-text-heading tracking-tight">
                Add New Document
              </h2>
              <p className="text-xs text-text-muted">
                Upload a document file or add a YouTube / article web link
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-bg-main rounded-2xl border border-border-light">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${uploadMode === "file" ? "bg-bg-card text-text-heading shadow-xs" : "text-text-muted hover:text-text-heading"
                  }`}
              >
                <Upload className="w-4 h-4 text-primary" />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("link")}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${uploadMode === "link" ? "bg-bg-card text-text-heading shadow-xs" : "text-text-muted hover:text-text-heading"
                  }`}
              >
                <Link2 className="w-4 h-4 text-primary" />
                <span>Add Web Link</span>
              </button>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Document Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-heading uppercase tracking-wider">
                  Document Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-xl border border-border-light bg-bg-main text-sm text-text-heading placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="e.g. Data Structures & Algorithms Chapter 1"
                />
              </div>

              {uploadMode === "file" ? (
                /* File Input Dropzone */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-heading uppercase tracking-wider">
                    Select File (PDF, DOCX, PPTX)
                  </label>
                  <div className="relative group">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.docx,.pptx"
                      onChange={handleFileChange}
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed transition-all ${uploadFile ? 'border-primary bg-primary/5' : 'border-border-light bg-bg-main group-hover:border-primary/50'
                      }`}>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-text-heading">
                          {uploadFile ? uploadFile.name : "Click to select a file or drag and drop"}
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5">Supports PDF, DOCX, PPTX up to 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Web Link Input */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-heading uppercase tracking-wider">
                    Web or YouTube URL
                  </label>
                  <div className="flex items-center gap-2 px-3.5 h-11 rounded-xl border border-border-light bg-bg-main focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-colors">
                    <Link2 className="w-4 h-4 text-text-muted shrink-0" />
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      required
                      className="w-full bg-transparent text-sm text-text-heading placeholder:text-text-placeholder focus:outline-none"
                      placeholder="https://youtube.com/watch?v=... or article URL"
                    />
                  </div>
                  <p className="text-[11px] text-text-muted">Extracts YouTube transcripts or website content into learning paths.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl border border-border-medium bg-bg-card text-xs font-bold text-text-body hover:bg-border-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                >
                  {uploading ? <Spinner size="sm" tone="white" inline /> : (uploadMode === 'link' ? 'Add Link' : 'Upload File')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-bg-card rounded-3xl shadow-xl border border-border-light p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-text-heading">Delete Document?</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-text-heading">"{selectedDoc?.title}"</span>? This will permanently remove its flashcards and quizzes.
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
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentListPage;
