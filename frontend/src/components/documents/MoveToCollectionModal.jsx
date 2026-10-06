import React from 'react';
import { X, Folder, FolderPlus, Check, Inbox } from 'lucide-react';

const MoveToCollectionModal = ({
  isOpen,
  onClose,
  document,
  collections = [],
  onSelectCollection,
  onOpenCreateCollection,
  isLoading = false,
}) => {
  if (!isOpen || !document) return null;

  const currentCollectionId = document.collection?._id || document.collectionId || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-bg-card rounded-3xl shadow-xl border border-border-light p-6 sm:p-7 flex flex-col gap-4 overflow-hidden">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-bg-card/75 backdrop-blur-xs rounded-3xl flex items-center justify-center z-20">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-bg-card border border-border-light rounded-2xl shadow-md text-xs font-bold text-text-heading">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span>Updating collection...</span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-heading hover:bg-border-light transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1">
            <Folder className="w-3.5 h-3.5" />
            <span>Organize Document</span>
          </div>
          <h2 className="text-lg font-extrabold text-text-heading tracking-tight">
            Move to Collection
          </h2>
          <p className="text-xs text-text-muted truncate" title={document.title}>
            Select where <strong className="text-text-heading font-semibold">"{document.title}"</strong> should be grouped.
          </p>
        </div>

        {/* Collection Options List */}
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1 pt-1">
          
          {/* Option: Uncategorized */}
          <button
            type="button"
            onClick={() => onSelectCollection(null)}
            disabled={isLoading}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              !currentCollectionId
                ? 'bg-primary-light border-primary/40 shadow-2xs'
                : 'bg-bg-main hover:bg-border-light/60 border-border-light'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-border-light text-text-muted flex items-center justify-center shrink-0">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-heading">None (Uncategorized)</p>
                <p className="text-[10px] text-text-muted">Keep document in the general pool</p>
              </div>
            </div>
            {!currentCollectionId && (
              <span className="p-1 rounded-full bg-primary text-white">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}
          </button>

          {/* User's Collections */}
          {collections.map((col) => {
            const isCurrent = currentCollectionId === col._id;
            const colColor = col.color || '#6366f1';

            return (
              <button
                key={col._id}
                type="button"
                onClick={() => onSelectCollection(col._id)}
                disabled={isLoading}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-primary-light border-primary/40 shadow-2xs'
                    : 'bg-bg-main hover:bg-border-light/60 border-border-light'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: `${colColor}20`,
                      color: colColor,
                    }}
                  >
                    <Folder className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-heading truncate">
                      {col.name}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {col.documentCount || 0} document{(col.documentCount || 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="p-1 rounded-full bg-primary text-white shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Shortcut to create new collection */}
        <div className="pt-2 border-t border-border-light flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenCreateCollection) onOpenCreateCollection();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create new collection</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border-medium text-text-body hover:bg-border-light text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default MoveToCollectionModal;
