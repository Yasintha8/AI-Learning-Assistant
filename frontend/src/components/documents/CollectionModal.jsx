import React, { useState, useEffect } from 'react';
import { X, Folder, Sparkles, Check } from 'lucide-react';

const PRESET_COLORS = [
  { value: '#6366f1', name: 'Indigo', bg: 'bg-indigo-500', text: 'text-indigo-500', ring: 'ring-indigo-500' },
  { value: '#8b5cf6', name: 'Violet', bg: 'bg-violet-500', text: 'text-violet-500', ring: 'ring-violet-500' },
  { value: '#ec4899', name: 'Pink', bg: 'bg-pink-500', text: 'text-pink-500', ring: 'ring-pink-500' },
  { value: '#f43f5e', name: 'Rose', bg: 'bg-rose-500', text: 'text-rose-500', ring: 'ring-rose-500' },
  { value: '#f59e0b', name: 'Amber', bg: 'bg-amber-500', text: 'text-amber-500', ring: 'ring-amber-500' },
  { value: '#10b981', name: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', ring: 'ring-emerald-500' },
  { value: '#14b8a6', name: 'Teal', bg: 'bg-teal-500', text: 'text-teal-500', ring: 'ring-teal-500' },
  { value: '#0ea5e9', name: 'Sky', bg: 'bg-sky-500', text: 'text-sky-500', ring: 'ring-sky-500' },
];

const CollectionModal = ({ isOpen, onClose, onSubmit, initialCollection = null, isLoading = false }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');

  useEffect(() => {
    if (initialCollection) {
      setName(initialCollection.name || '');
      setDescription(initialCollection.description || '');
      setColor(initialCollection.color || '#6366f1');
    } else {
      setName('');
      setDescription('');
      setColor('#6366f1');
    }
  }, [initialCollection, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      color,
    });
  };

  const isEdit = Boolean(initialCollection?._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-bg-card rounded-3xl shadow-xl border border-border-light p-6 sm:p-8 flex flex-col gap-5">

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text-heading hover:bg-border-light transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1">
            <Folder className="w-3.5 h-3.5" />
            <span>{isEdit ? 'Edit Collection' : 'New Collection'}</span>
          </div>
          <h2 className="text-xl font-extrabold text-text-heading tracking-tight">
            {isEdit ? 'Update Collection' : 'Create New Collection'}
          </h2>
          <p className="text-xs text-text-muted">
            Group your study documents, lecture notes, and videos into organized topic workspaces.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Collection Name */}
          <div className="space-y-1.5">
            <label htmlFor="collection-name" className="text-xs font-bold text-text-heading uppercase tracking-wider flex items-center justify-between">
              <span>Collection Name *</span>
              <span className="text-[10px] text-text-muted font-normal">{name.length}/60</span>
            </label>
            <input
              id="collection-name"
              type="text"
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Science, Machine Learning, Midterms"
              className="w-full px-4 py-2.5 bg-bg-main border border-border-light rounded-xl text-xs sm:text-sm text-text-heading placeholder-text-placeholder focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          {/* Color Palette Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-heading uppercase tracking-wider block">
              Theme Color
            </label>
            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              {PRESET_COLORS.map((c) => {
                const isSelected = color.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    title={c.name}
                    className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer ${isSelected ? 'ring-2 ring-offset-2 ring-primary scale-110 shadow-sm' : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="collection-desc" className="text-xs font-bold text-text-heading uppercase tracking-wider flex items-center justify-between">
              <span>Description <span className="text-text-muted font-normal">(Optional)</span></span>
              <span className="text-[10px] text-text-muted font-normal">{description.length}/250</span>
            </label>
            <textarea
              id="collection-desc"
              rows={2}
              maxLength={250}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Required reading and slide decks for Semester 4"
              className="w-full px-4 py-2 bg-bg-main border border-border-light rounded-xl text-xs text-text-heading placeholder-text-placeholder focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Live Preview */}
          <div className="p-3 bg-bg-main/70 border border-border-light rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Preview Badge:</span>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all"
                style={{
                  backgroundColor: `${color}18`,
                  color: color,
                  borderColor: `${color}40`,
                  borderWidth: '1px',
                }}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{name.trim() || 'Untitled Collection'}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-border-medium text-text-body hover:bg-border-light text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isEdit ? 'Update Collection' : 'Create Collection'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default CollectionModal;
