import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, BookOpen, BrainCircuit, Clock, Video, Globe, Presentation, ArrowRight, Target, Sparkles } from 'lucide-react';
import moment from 'moment';
import { getProgressBandStyle } from '../../utils/learningPathStatus';

const FILE_TYPE_STYLES = {
    pdf: { icon: FileText, gradient: 'from-rose-500 to-red-600', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', shadow: 'shadow-rose-500/20' },
    docx: { icon: FileText, gradient: 'from-blue-500 to-indigo-600', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', shadow: 'shadow-blue-500/20' },
    pptx: { icon: Presentation, gradient: 'from-amber-500 to-orange-600', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', shadow: 'shadow-amber-500/20' },
    youtube: { icon: Video, gradient: 'from-pink-500 to-rose-600', text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10', shadow: 'shadow-pink-500/20' },
    website: { icon: Globe, gradient: 'from-teal-500 to-cyan-600', text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10', shadow: 'shadow-teal-500/20' },
};
const DEFAULT_TYPE_STYLE = { icon: FileText, gradient: 'from-primary to-blue-600', text: 'text-primary', bg: 'bg-primary/10', shadow: 'shadow-primary/20' };

const formatFileSize = (bytes) => {
    if (bytes === undefined || bytes === null) return null;

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const DocumentCard = ({ document, onDelete }) => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate(`/documents/${document._id}`);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(document);
    };

    const typeStyle = FILE_TYPE_STYLES[document.fileType] || DEFAULT_TYPE_STYLE;
    const TypeIcon = typeStyle.icon;
    const fileSizeStr = formatFileSize(document.fileSize);

    return (
        <div
            className="group relative bg-bg-card border border-border-light hover:border-primary/40 rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden hover:-translate-y-0.5"
            onClick={handleNavigate}
        >
            {/* Corner Delete Action Button */}
            <button
                onClick={handleDelete}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-xl flex items-center justify-center bg-bg-card/80 backdrop-blur-xs border border-border-light text-text-muted hover:text-rose-500 hover:bg-rose-500/10 shadow-xs transition-all duration-150 opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="Delete document"
                title="Delete document"
            >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
            </button>

            {/* Top Info Section */}
            <div className="flex flex-col gap-3.5">
                {/* Header Icon + Type Badge */}
                <div className="flex items-center justify-between gap-2">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${typeStyle.gradient} flex items-center justify-center text-white shadow-md ${typeStyle.shadow} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                        <TypeIcon className="w-5 h-5" strokeWidth={2} />
                    </div>

                    <div className="flex items-center gap-1.5 pr-8 sm:pr-0">
                        {document.fileType && (
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-border-light ${typeStyle.bg} ${typeStyle.text}`}>
                                {document.fileType}
                            </span>
                        )}
                        {fileSizeStr && (
                            <span className="text-[10px] font-semibold text-text-muted bg-border-light px-2 py-0.5 rounded-md">
                                {fileSizeStr}
                            </span>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div className="min-w-0" title={document.title}>
                    <h3 className="text-base font-bold text-text-heading leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {document.title}
                    </h3>
                </div>

                {/* Study feature badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    {document.flashcardCount !== undefined && document.flashcardCount > 0 && (
                        <div className="flex items-center gap-1.5 bg-violet-500/10 px-2.5 py-1 rounded-lg">
                            <BookOpen className="w-3.5 h-3.5 text-violet-500" strokeWidth={2} />
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                {document.flashcardCount} Cards
                            </span>
                        </div>
                    )}
                    {document.quizCount !== undefined && document.quizCount > 0 && (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                            <BrainCircuit className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {document.quizCount} Quizzes
                            </span>
                        </div>
                    )}
                </div>

                {/* Learning path progress */}
                {document.learningPathProgress !== null && document.learningPathProgress !== undefined && (() => {
                    const band = getProgressBandStyle(document.learningPathProgress);
                    return (
                        <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-text-muted flex items-center gap-1">
                                    <Target className="w-3.5 h-3.5 text-primary" /> Mastery Progress
                                </span>
                                <span className={`tabular-nums font-bold ${band.text}`}>
                                    {document.learningPathProgress}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-border-light rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${band.bar} transition-all duration-500`}
                                    style={{ width: `${document.learningPathProgress}%` }}
                                />
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Footer Section */}
            <div className="mt-auto pt-3 border-t border-border-light flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={2} />
                    <span className="text-xs text-text-muted truncate">
                        {moment(document.lastAccessed || document.createdAt).fromNow()}
                    </span>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:text-primary-hover transition-colors shrink-0">
                    <span>Study</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
                </div>
            </div>

            {/* Bottom Gradient Accent Indicator */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${typeStyle.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left`} />
        </div>
    );
};

export default DocumentCard;
