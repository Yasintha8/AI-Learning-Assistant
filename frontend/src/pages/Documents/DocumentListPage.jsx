import React, { useState, useEffect } from "react";
import { Plus, Upload, Trash2, FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import documentService from "../../services/documentService";
import Spinner from "../../components/common/Spinner";
import Button from "../../components/common/Button";
import DocumentCard from "../../components/documents/DocumentCard";

const DocumentListPage = () => {


  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
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

  const handleUpload = async (e) => {
    e.preventDefault();
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
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle("");
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner />
        </div>
      )
    }
    if (documents.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
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
              Get started by uploading your first PDF document to begin
              learning.
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

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {documents?.map((doc) => (
          <DocumentCard
            key={doc._id}
            document={doc}
            onDelete={handleDeleteRequest}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Subtle background pattern */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

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
        {renderContent()}
      </div>

      {isUploadModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="relative w-full max-w-md bg-bg-card rounded-2xl shadow-xl border border-border-light p-6 flex flex-col gap-6">
          {/* Close button */}
          <button
            onClick={() => setIsUploadModalOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-body hover:bg-border-light transition-colors duration-150 cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col gap-1 pr-8">
            <h2 className="text-lg font-bold text-text-heading tracking-tight">
              Upload New Document
            </h2>
            <p className="text-sm text-text-muted">
              Add a PDF document to your library
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUpload} className="flex flex-col gap-5">
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

            {/* File Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-body uppercase tracking-wider">
                PDF File
              </label>
              <div className="relative group">
                <input id="file-upload" type="file" accept=".pdf" onChange={handleFileChange} required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
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
                  <p className="text-xs text-text-placeholder">PDF up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={() => setIsUploadModalOpen(false)} disabled={uploading} className="flex-1 h-11 rounded-xl border border-border-medium bg-bg-card text-sm font-semibold text-text-body hover:bg-border-light transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                Cancel
              </button>

              <button type="submit" disabled={uploading} className="flex-1 h-11 rounded-xl bg-linear-to-r from-primary to-blue-400 text-white text-sm font-semibold hover:from-primary-hover hover:to-cyan-400 transition-all duration-200 shadow-sm shadow-primary-shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {uploading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  "Upload"
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
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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