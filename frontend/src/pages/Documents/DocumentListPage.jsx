import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Upload, Trash2, FileText, X, Link2, Search, SearchX, Grid, List,
  Presentation, Video, Globe, Clock, Target, ArrowRight, Sparkles, Filter,
  Folder, FolderPlus, FolderOpen, FolderInput, Inbox, Layers, Edit3, AlertCircle
} from "lucide-react";
import toast from '../../utils/toast';
import documentService from "../../services/documentService";
import collectionService from "../../services/collectionService";
import Spinner from "../../components/common/Spinner";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import DocumentCard from "../../components/documents/DocumentCard";
import CollectionModal from "../../components/documents/CollectionModal";
import MoveToCollectionModal from "../../components/documents/MoveToCollectionModal";
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
  const [collections, setCollections] = useState([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search / filter / sort / layout state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [layoutMode, setLayoutMode] = useState("grid"); // 'grid' | 'list'
  const [selectedCollectionId, setSelectedCollectionId] = useState("all"); // 'all' | 'uncategorized' | collectionId

  // Upload modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState("file"); // 'file' | 'link'
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadCollectionId, setUploadCollectionId] = useState("");
  const [uploading, setUploading] = useState(false);

  // Delete document modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Collection modal states (create / edit)
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [collectionSubmitting, setCollectionSubmitting] = useState(false);

  // Delete collection modal state
  const [isDeleteCollectionModalOpen, setIsDeleteCollectionModalOpen] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState(null);
  const [deleteCollectionSubmitting, setDeleteCollectionSubmitting] = useState(false);

  // Move document modal state
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [movingDocument, setMovingDocument] = useState(null);
  const [movingSubmitting, setMovingSubmitting] = useState(false);

  const fetchCollections = async () => {
    try {
      const res = await collectionService.getCollections();
      if (res?.success) {
        setCollections(res.data || []);
        setUncategorizedCount(res.uncategorizedCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    }
  };

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

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchCollections(), fetchDocuments()]);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const openUploadModal = (prefillCollectionId = null) => {
    if (prefillCollectionId) {
      setUploadCollectionId(prefillCollectionId);
    } else if (selectedCollectionId !== "all" && selectedCollectionId !== "uncategorized") {
      setUploadCollectionId(selectedCollectionId);
    } else {
      setUploadCollectionId("");
    }
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadMode("file");
    setUploadFile(null);
    setUploadTitle("");
    setLinkUrl("");
    setUploadCollectionId("");
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (uploadMode === "link") {
      if (!linkUrl || !uploadTitle) {
        toast.error("Please provide a title and a URL.");
        return;
      }
      setUploading(true);
      try {
        await documentService.addDocumentFromUrl({
          url: linkUrl,
          title: uploadTitle,
          collectionId: uploadCollectionId || null,
        });
        toast.success("Document added successfully!");
        closeUploadModal();
        fetchAllData();
      } catch (error) {
        toast.error(error.message || error.error || "Failed to add document from link.");
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
    if (uploadCollectionId) {
      formData.append("collectionId", uploadCollectionId);
    }

    try {
      await documentService.uploadDocument(formData);
      toast.success("Document uploaded successfully!");
      closeUploadModal();
      fetchAllData();
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
      setDocuments((prev) => prev.filter((d) => d._id !== selectedDoc._id));
      fetchCollections(); // Refresh counts
    } catch (error) {
      toast.error(error.message || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  // Collection CRUD handlers
  const handleSaveCollection = async (formData) => {
    try {
      setCollectionSubmitting(true);
      if (editingCollection) {
        const res = await collectionService.updateCollection(editingCollection._id, formData);
        if (res?.success) {
          toast.success("Collection updated successfully!");
          setIsCollectionModalOpen(false);
          setEditingCollection(null);
          fetchCollections();
          fetchDocuments();
        }
      } else {
        const res = await collectionService.createCollection(formData);
        if (res?.success) {
          toast.success("Collection created successfully!");
          setIsCollectionModalOpen(false);
          await fetchCollections();
          if (res.data?._id) {
            setSelectedCollectionId(res.data._id);
          }
        }
      }
    } catch (error) {
      toast.error(error.message || error.error || "Failed to save collection");
    } finally {
      setCollectionSubmitting(false);
    }
  };

  const handleConfirmDeleteCollection = async () => {
    if (!deletingCollection) return;
    try {
      setDeleteCollectionSubmitting(true);
      await collectionService.deleteCollection(deletingCollection._id);
      toast.success("Collection deleted. Materials moved to Uncategorized.");
      setIsDeleteCollectionModalOpen(false);
      if (selectedCollectionId === deletingCollection._id) {
        setSelectedCollectionId("all");
      }
      setDeletingCollection(null);
      fetchAllData();
    } catch (error) {
      toast.error(error.message || error.error || "Failed to delete collection");
    } finally {
      setDeleteCollectionSubmitting(false);
    }
  };

  // Move document handler
  const handleSelectCollectionForDoc = async (targetCollectionId) => {
    if (!movingDocument) return;
    try {
      setMovingSubmitting(true);
      const res = await documentService.updateDocumentCollection(movingDocument._id, targetCollectionId);
      if (res?.success) {
        toast.success(res.message || "Document collection updated!");
        setIsMoveModalOpen(false);
        setMovingDocument(null);
        // Optimistically update document in list
        setDocuments((prev) =>
          prev.map((d) =>
            d._id === movingDocument._id
              ? {
                  ...d,
                  collectionId: targetCollectionId,
                  collection: res.data?.collection || null,
                }
              : d
          )
        );
        fetchCollections(); // Update counts
      }
    } catch (error) {
      toast.error(error.message || error.error || "Failed to move document");
    } finally {
      setMovingSubmitting(false);
    }
  };

  // Active selected collection object
  const activeCollection = useMemo(() => {
    if (selectedCollectionId === "all" || selectedCollectionId === "uncategorized") return null;
    return collections.find((c) => c._id === selectedCollectionId) || null;
  }, [collections, selectedCollectionId]);

  // Filtered documents calculation
  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = documents.filter((doc) => {
      // Collection Filter
      let matchesCollection = true;
      if (selectedCollectionId === "uncategorized") {
        matchesCollection = !doc.collectionId && !doc.collection;
      } else if (selectedCollectionId !== "all") {
        const docColId = doc.collection?._id || doc.collectionId;
        matchesCollection = docColId === selectedCollectionId;
      }

      // Search & FileType Filter
      const matchesQuery = !query || doc.title?.toLowerCase().includes(query);
      const matchesType = typeFilter === "all" || doc.fileType === typeFilter;

      return matchesCollection && matchesQuery && matchesType;
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
  }, [documents, selectedCollectionId, searchQuery, typeFilter, sortBy]);

  const fileCount = documents.filter((d) => ['pdf', 'docx', 'pptx'].includes(d.fileType)).length;
  const linkCount = documents.filter((d) => ['youtube', 'website'].includes(d.fileType)).length;

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setSelectedCollectionId("all");
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header Banner */}
        <div className="relative overflow-hidden bg-linear-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <FileText className="w-3.5 h-3.5" />
                <span>Document Knowledge Base & Workspaces</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-text-heading tracking-tight font-display">
                My Documents & Collections
              </h1>

              <p className="text-text-muted text-sm sm:text-base max-w-xl font-body">
                Upload PDFs, notes, YouTube videos, or articles to generate interactive AI study paths organized by topic collections.
              </p>

              {/* Summary Stats Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-bg-card border border-border-light text-text-heading shadow-xs">
                  📁 {documents.length} Total
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-bg-card border border-border-light text-text-heading shadow-xs">
                  📚 {collections.length} Collections
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-bg-card border border-border-light text-text-heading shadow-xs">
                  📄 {fileCount} Files
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-bg-card border border-border-light text-text-heading shadow-xs">
                  🔗 {linkCount} Web Links
                </span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => {
                  setEditingCollection(null);
                  setIsCollectionModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-bg-card border border-border-medium hover:border-primary/40 text-text-heading text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-primary" />
                <span>New Collection</span>
              </button>

              <button
                type="button"
                onClick={() => openUploadModal()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20 cursor-pointer active:scale-98"
              >
                <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
                <span>Upload Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collection Workspaces Navigation Bar */}
        <div className="bg-bg-card border border-border-light rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary-light text-primary rounded-xl border border-primary/20">
                <Folder className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-heading font-display flex items-center gap-2">
                  <span>Collections & Workspaces</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-border-light text-text-muted">
                    {collections.length} active
                  </span>
                </h3>
                <p className="text-xs text-text-muted font-body">
                  Filter or organize your materials by course, exam, or study subject
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingCollection(null);
                setIsCollectionModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-light hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create Collection</span>
            </button>
          </div>

          {/* Horizontal Scrollable Collection Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            {/* All Documents Pill */}
            <button
              type="button"
              onClick={() => setSelectedCollectionId("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                selectedCollectionId === "all"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-bg-main border border-border-light text-text-muted hover:text-text-heading hover:bg-border-light/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Documents</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  selectedCollectionId === "all" ? "bg-white/20 text-white" : "bg-border-light text-text-muted"
                }`}
              >
                {documents.length}
              </span>
            </button>

            {/* Custom Collections Pills */}
            {collections.map((col) => {
              const isSelected = selectedCollectionId === col._id;
              const colColor = col.color || "#6366f1";
              return (
                <button
                  key={col._id}
                  type="button"
                  onClick={() => setSelectedCollectionId(col._id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? "text-white shadow-xs"
                      : "bg-bg-main border border-border-light text-text-muted hover:text-text-heading hover:bg-border-light/60"
                  }`}
                  style={isSelected ? { backgroundColor: colColor } : {}}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: isSelected ? "#ffffff" : colColor }}
                  />
                  <span className="truncate max-w-40">{col.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isSelected ? "bg-white/20 text-white" : "bg-border-light text-text-muted"
                    }`}
                  >
                    {col.documentCount || 0}
                  </span>
                </button>
              );
            })}

            {/* Uncategorized Pill */}
            <button
              type="button"
              onClick={() => setSelectedCollectionId("uncategorized")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                selectedCollectionId === "uncategorized"
                  ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 shadow-xs"
                  : "bg-bg-main border border-border-light text-text-muted hover:text-text-heading hover:bg-border-light/60"
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Uncategorized</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  selectedCollectionId === "uncategorized"
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-neutral-900"
                    : "bg-border-light text-text-muted"
                }`}
              >
                {uncategorizedCount}
              </span>
            </button>
          </div>

          {/* Active Collection Header Bar */}
          {activeCollection && (
            <div
              className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in"
              style={{
                backgroundColor: `${activeCollection.color || '#6366f1'}0d`,
                borderColor: `${activeCollection.color || '#6366f1'}30`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: `${activeCollection.color || '#6366f1'}25`,
                    color: activeCollection.color || '#6366f1',
                  }}
                >
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4
                    className="text-sm font-extrabold truncate"
                    style={{ color: activeCollection.color || '#6366f1' }}
                  >
                    {activeCollection.name}
                  </h4>
                  <p className="text-xs text-text-muted truncate">
                    {activeCollection.description || `${activeCollection.documentCount || 0} documents organized in this collection`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => openUploadModal(activeCollection._id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-card border border-border-light text-xs font-bold text-text-heading hover:bg-border-light transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>Upload to Collection</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingCollection(activeCollection);
                    setIsCollectionModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-bg-card border border-border-light text-text-muted hover:text-text-heading hover:bg-border-light transition-colors shadow-2xs cursor-pointer"
                  title="Edit Collection Name & Color"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeletingCollection(activeCollection);
                    setIsDeleteCollectionModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-bg-card border border-border-light text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors shadow-2xs cursor-pointer"
                  title="Delete Collection"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar Bar: Search, Type Tabs, Sort, View Switcher */}
        {documents.length > 0 && (
          <div className="bg-bg-card border border-border-light rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              {/* Search Bar */}
              <div className="relative flex-1 min-w-60">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeCollection ? activeCollection.name : "documents"}...`}
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-muted hidden sm:inline">Sort:</span>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    options={SORT_OPTIONS}
                    size="lg"
                    ariaLabel="Sort documents"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center p-1 bg-bg-main border border-border-light rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setLayoutMode("grid")}
                    title="Grid View"
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      layoutMode === "grid" ? "bg-bg-card text-primary shadow-xs" : "text-text-muted hover:text-text-heading"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLayoutMode("list")}
                    title="List View"
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      layoutMode === "list" ? "bg-bg-card text-primary shadow-xs" : "text-text-muted hover:text-text-heading"
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    typeFilter === t.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-bg-main border border-border-light text-text-muted hover:text-text-heading hover:bg-border-light/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}

              {(searchQuery || typeFilter !== 'all' || selectedCollectionId !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-600 px-2 py-1 shrink-0 cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Display */}
        {loading ? (
          <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading documents">
            <div className="bg-bg-card border border-border-light rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="h-11 w-full sm:w-72 bg-border-light rounded-xl" />
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="h-10 w-28 bg-border-light rounded-xl" />
                <div className="h-10 w-20 bg-border-light rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-bg-card border border-border-light rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-border-medium/60 shrink-0" />
                    <div className="space-y-2 flex-1 pt-1">
                      <div className="h-4 w-3/4 bg-border-medium/60 rounded-md" />
                      <div className="h-3 w-1/3 bg-border-light rounded-md" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-16 bg-border-light rounded-md" />
                      <div className="h-3 w-10 bg-border-light rounded-md" />
                    </div>
                    <div className="h-2 w-full bg-border-light rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : documents.length === 0 ? (
          /* Empty Documents State */
          <div className="bg-bg-card border border-border-light rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-heading font-display">No Documents Uploaded</h3>
              <p className="text-xs text-text-muted mt-1 font-body">
                Upload your first PDF, DOCX, PPTX, or paste a video link to start creating AI learning paths and organize them into collections.
              </p>
            </div>
            <button
              onClick={() => openUploadModal()}
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
              <h3 className="text-base font-bold text-text-heading font-display">No matching documents found</h3>
              <p className="text-xs text-text-muted mt-1 font-body">
                {activeCollection
                  ? `There are no documents in '${activeCollection.name}' matching your filters.`
                  : "Try searching for a different keyword or resetting your filter criteria."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border-medium bg-bg-card text-xs font-bold text-text-heading hover:bg-border-light transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
              {activeCollection && (
                <button
                  onClick={() => openUploadModal(activeCollection._id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Here</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Documents List / Grid */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
              <span>
                Showing {filteredDocuments.length} of {documents.length} document{documents.length === 1 ? "" : "s"}
                {activeCollection && (
                  <span className="font-bold text-text-heading ml-1">in {activeCollection.name}</span>
                )}
              </span>
            </div>

            {layoutMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc._id}
                    document={doc}
                    onDelete={handleDeleteRequest}
                    onMoveToCollection={(d) => {
                      setMovingDocument(d);
                      setIsMoveModalOpen(true);
                    }}
                    onFilterByCollection={(colId) => setSelectedCollectionId(colId)}
                  />
                ))}
              </div>
            ) : (
              /* Compact List View Mode */
              <div className="bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-xs divide-y divide-border-light">
                {filteredDocuments.map((doc) => {
                  const progress = doc.learningPathProgress || 0;
                  const band = getProgressBandStyle(progress);
                  const col = doc.collection || null;

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
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-text-heading group-hover:text-primary transition-colors truncate">
                              {doc.title}
                            </h4>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-border-light text-text-muted shrink-0">
                              {doc.fileType || 'PDF'}
                            </span>
                            {col && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCollectionId(col._id);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 transition-transform hover:scale-105 cursor-pointer"
                                style={{
                                  backgroundColor: `${col.color || '#6366f1'}15`,
                                  color: col.color || '#6366f1',
                                  borderColor: `${col.color || '#6366f1'}35`,
                                }}
                              >
                                <Folder className="w-3 h-3" />
                                <span>{col.name}</span>
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
                            <span>Uploaded {moment(doc.createdAt || doc.uploadDate).fromNow()}</span>
                            {doc.flashcardCount > 0 && (
                              <>
                                <span>·</span>
                                <span>{doc.flashcardCount} cards</span>
                              </>
                            )}
                            {doc.quizCount > 0 && (
                              <>
                                <span>·</span>
                                <span>{doc.quizCount} quizzes</span>
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
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovingDocument(doc);
                            setIsMoveModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary-light transition-colors cursor-pointer"
                          title="Move to Collection"
                        >
                          <FolderInput className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRequest(doc);
                          }}
                          className="p-2 rounded-xl text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:text-primary-hover">
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

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-bg-card rounded-3xl shadow-xl border border-border-light p-6 sm:p-8 flex flex-col gap-6">

            <button
              onClick={closeUploadModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-heading hover:bg-border-light transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-text-heading tracking-tight font-display">
                Add New Document
              </h2>
              <p className="text-xs text-text-muted font-body">
                Upload a document file or add a YouTube / article web link to your workspace
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-bg-main rounded-2xl border border-border-light">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  uploadMode === "file" ? "bg-bg-card text-text-heading shadow-xs" : "text-text-muted hover:text-text-heading"
                }`}
              >
                <Upload className="w-4 h-4 text-primary" />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("link")}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  uploadMode === "link" ? "bg-bg-card text-text-heading shadow-xs" : "text-text-muted hover:text-text-heading"
                }`}
              >
                <Link2 className="w-4 h-4 text-primary" />
                <span>Add Web Link</span>
              </button>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              
              {/* Document Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-heading uppercase tracking-wider">
                  Document Title *
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

              {/* Assign to Collection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-heading uppercase tracking-wider flex items-center justify-between">
                  <span>Assign to Collection <span className="text-text-muted font-normal">(Optional)</span></span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCollection(null);
                      setIsCollectionModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </label>
                <select
                  value={uploadCollectionId}
                  onChange={(e) => setUploadCollectionId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border-light bg-bg-main text-xs sm:text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">None (Uncategorized)</option>
                  {collections.map((col) => (
                    <option key={col._id} value={col._id}>
                      📁 {col.name} ({col.documentCount || 0} docs)
                    </option>
                  ))}
                </select>
              </div>

              {uploadMode === "file" ? (
                /* File Input Dropzone */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-heading uppercase tracking-wider">
                    Select File (PDF, DOCX, PPTX) *
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
                    <div
                      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed transition-all ${
                        uploadFile ? 'border-primary bg-primary/5' : 'border-border-light bg-bg-main group-hover:border-primary/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-text-heading">
                          {uploadFile ? uploadFile.name : "Click to select a file or drag and drop"}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">Supports PDF, DOCX, PPTX</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Web Link Input */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-heading uppercase tracking-wider">
                    Web or YouTube URL *
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
                  className="flex-1 py-2.5 rounded-xl border border-border-medium bg-bg-card text-xs font-bold text-text-body hover:bg-border-light transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadTitle || (uploadMode === 'file' ? !uploadFile : !linkUrl)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Add Document</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {isDeleteModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-bg-card rounded-3xl shadow-xl border border-border-light p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-text-heading font-display">Delete Document?</h3>
              <p className="text-xs text-text-muted font-body leading-relaxed">
                Are you sure you want to delete <strong className="text-text-heading">"{selectedDoc.title}"</strong>?
                This will also remove all associated flashcards and quiz questions.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-border-medium text-xs font-bold text-text-body hover:bg-border-light transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Collection Confirmation Modal */}
      {isDeleteCollectionModalOpen && deletingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-bg-card rounded-3xl shadow-xl border border-border-light p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-text-heading font-display">Delete Collection?</h3>
              <p className="text-xs text-text-muted font-body leading-relaxed">
                Are you sure you want to delete <strong className="text-text-heading">"{deletingCollection.name}"</strong>?
              </p>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold text-left">
                ✓ Documents will NOT be deleted. They will remain safely in your Uncategorized list.
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteCollectionModalOpen(false)}
                disabled={deleteCollectionSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-border-medium text-xs font-bold text-text-body hover:bg-border-light transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCollection}
                disabled={deleteCollectionSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deleteCollectionSubmitting ? "Deleting..." : "Delete Collection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Collection Modal */}
      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setEditingCollection(null);
        }}
        onSubmit={handleSaveCollection}
        initialCollection={editingCollection}
        isLoading={collectionSubmitting}
      />

      {/* Move to Collection Modal */}
      <MoveToCollectionModal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setMovingDocument(null);
        }}
        document={movingDocument}
        collections={collections}
        onSelectCollection={handleSelectCollectionForDoc}
        onOpenCreateCollection={() => {
          setEditingCollection(null);
          setIsCollectionModalOpen(true);
        }}
        isLoading={movingSubmitting}
      />

    </>
  );
};

export default DocumentListPage;
