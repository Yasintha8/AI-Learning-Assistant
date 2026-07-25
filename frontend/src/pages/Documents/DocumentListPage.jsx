import React, { useState, useEffect, useMemo } from "react";
import { Plus, Upload, Trash2, FileText, X, Link2, Search, SearchX } from "lucide-react";
import toast from '../../utils/toast';
import documentService from "../../services/documentService";
import Spinner from "../../components/common/Spinner";
import Button from "../../components/common/Button";
import DocumentCard from "../../components/documents/DocumentCard";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name", label: "Name (A–Z)" },
];

const selectClassName = "h-10 px-3 rounded-xl border border-border-medium bg-bg-card text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150 cursor-pointer";

const DocumentListPage = () => {


  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for search / filter / sort toolbar
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // State for upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState("file"); // 'file' | 'link'
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchDocuments = async () => {
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
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
        toast.error("Please provide a title and a link.");
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

  const availableTypes = useMemo(
    () => [...new Set(documents.map((d) => d.fileType).filter(Boolean))],
    [documents]
  );

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = documents.filter((doc) => {
      const matchesQuery = !query || doc.title?.toLowerCase().includes(query);
      const matchesType = typeFilter === "all" || doc.fileType === typeFilter;
      return matchesQuery && matchesType;
    });

    const sorted = [...filtered];
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
    } else if (sortBy === "name") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return sorted;
  }, [documents, searchQuery, typeFilter, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== "" || typeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-100">
          <Spinner />
        </div>
      )
    }
    if (documents.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-border-light to-bg-card border border-border-medium shadow-sm shadow-border-medium mb-6">
              <FileText
                className="w-10 h-10 text-text-muted"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-xl text-text-heading font-bold tracking-tight mb-2">
              No Documents Yet
            </h3>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              Get started by adding your first PDF, DOCX, PPTX, YouTube video,
              or website link to begin learning.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-linear-to-r from-primary to-blue-400 text-white text-sm font-semibold hover:from-primary-hover hover:to-cyan-400 transition-all duration-200 shadow-md shadow-primary-shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Upload Document
            </button>
          </div>
        </div>
      );
    }

    if (filteredDocuments.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-border-light mb-5">
              <SearchX className="w-7 h-7 text-text-muted" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg text-text-heading font-bold tracking-tight mb-2">
              No matching documents
            </h3>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              Try adjusting your search or filters to find what you're looking for.
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
          Showing {filteredDocuments.length} of {documents.length} document{documents.length === 1 ? "" : "s"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc._id}
              document={doc}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Subtle background pattern */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-linear(ellipse_at_top_right,_var(--tw-linear-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="relative max-w-6xl mx-auto px-6 py-5 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-text-heading tracking-tight">
              My Documents
            </h1>
            <p className="text-sm text-text-muted">
              Manage and organize your learning materials
            </p>
          </div>
          {documents.length > 0 && (
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors duration-150 shadow-sm shadow-primary-shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Upload Document
            </Button>
          )}
        </div>

        {/* Search / Filter / Sort Toolbar */}
        {documents.length > 0 && (
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full h-10 bg-bg-card border border-border-medium rounded-xl pl-10 pr-4 text-sm text-text-heading placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-150"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={selectClassName}
              >
                <option value="all">All Types</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
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

      {isUploadModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="relative w-full max-w-md bg-bg-card rounded-2xl shadow-xl border border-border-light p-6 flex flex-col gap-6">
          {/* Close button */}
          <button
            onClick={closeUploadModal}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-body hover:bg-border-light transition-colors duration-150 cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col gap-1 pr-8">
            <h2 className="text-lg font-bold text-text-heading tracking-tight">
              Add New Document
            </h2>
            <p className="text-sm text-text-muted">
              Add a PDF/DOCX/PPTX file, a YouTube video, or a website link
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-bg-main rounded-xl border border-border-medium">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer ${uploadMode === "file" ? "bg-bg-card text-text-heading shadow-sm border border-border-medium" : "text-text-muted hover:text-text-body"}`}
            >
              <Upload className="w-4 h-4" strokeWidth={2} />
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("link")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer ${uploadMode === "link" ? "bg-bg-card text-text-heading shadow-sm border border-border-medium" : "text-text-muted hover:text-text-body"}`}
            >
              <Link2 className="w-4 h-4" strokeWidth={2} />
              Add Link
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Title Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-body uppercase tracking-wider">
                Document Title
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                required
                className="h-11 px-4 rounded-xl border border-border-medium bg-bg-main text-sm text-text-body placeholder:text-text-placeholder hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors duration-150"
                placeholder="e.g., React Interview Prep"
              />
            </div>

            {uploadMode === "file" ? (
              /* File Upload */
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-body uppercase tracking-wider">
                  Document File
                </label>
                <div className="relative group">
                  <input id="file-upload" type="file" accept=".pdf,.docx,.pptx" onChange={handleFileChange} required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={`flex flex-col items-center justify-center gap-3 px-4 py-8 rounded-xl border-2 border-dashed transition-colors duration-150 ${uploadFile ? 'border-primary bg-primary-light' : 'border-border-medium bg-bg-main group-hover:border-primary '}`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${uploadFile ? 'bg-linear-to-br from-primary to-blue-400' : 'bg-border-light'}`}>
                      <Upload className={`w-5 h-5 ${uploadFile ? 'text-white' : 'text-text-muted'}`} strokeWidth={2} />
                    </div>
                    <p className="text-sm text-center text-text-muted"> {uploadFile ? (
                      <span className="font-medium text-primary">
                        {uploadFile.name}
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold text-text-body">
                          Click to upload a file
                        </span>{" "}
                        or drag and drop
                      </>
                    )}</p>
                    <p className="text-xs text-text-placeholder">PDF, DOCX or PPTX up to 10MB</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Link Input */
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-body uppercase tracking-wider">
                  Document Link
                </label>
                <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-border-medium bg-bg-main hover:border-primary focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-colors duration-150">
                  <Link2 className="w-4 h-4 text-text-muted shrink-0" strokeWidth={2} />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm text-text-body placeholder:text-text-placeholder focus:outline-none"
                    placeholder="https://youtube.com/watch?v=... or https://example.com/article"
                  />
                </div>
                <p className="text-xs text-text-placeholder">Paste a YouTube video link or a website/article link</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={closeUploadModal} disabled={uploading} className="flex-1 h-11 rounded-xl border border-border-medium bg-bg-card text-sm font-semibold text-text-body hover:bg-border-light transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                Cancel
              </button>

              <button type="submit" disabled={uploading} className="flex-1 h-11 rounded-xl bg-linear-to-r from-primary to-blue-400 text-white text-sm font-semibold hover:from-primary-hover hover:to-cyan-400 transition-all duration-200 shadow-sm shadow-primary-shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {uploading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Spinner size="sm" tone="white" inline />
                    {uploadMode === "link" ? "Adding..." : "Uploading..."}
                  </span>
                ) : (
                  uploadMode === "link" ? "Add Document" : "Upload"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>)}

      {isDeleteModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="relative w-full max-w-sm bg-bg-card rounded-2xl shadow-xl border border-border-light p-6 flex flex-col gap-5">
          {/* Close button */}
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-body hover:bg-border-light transition-colors duration-150 cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col items-center gap-3 pt-2 text-center">
            <div className="w-14 h-14 rounded-2xl bg-error-bg border border-error-border flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-error" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-text-heading tracking-tight">
              Confirm Deletion
            </h2>
          </div>

          {/* Content */}
          <p className="text-sm text-text-muted text-center leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-text-body">
              {selectedDoc?.title}
            </span>
            ? This action cannot be undone.
          </p>

          {/* Action Buttons */}
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
      </div>}
    </div>
  );
}

export default DocumentListPage