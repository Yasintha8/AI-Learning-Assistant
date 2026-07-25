import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, BookOpen, BrainCircuit, Clock, Video, Globe, Presentation, ArrowRight, Target } from 'lucide-react';
import moment from 'moment';
import { getProgressBandStyle } from '../../utils/learningPathStatus';

// Color-coded by file type (à la Google Drive) so a grid of mixed documents
// is scannable at a glance instead of every card wearing the same icon color.
const FILE_TYPE_STYLES = {
    pdf: { icon: FileText, gradient: 'from-rose-400 to-red-500', shadow: 'shadow-red-500/20' },
    docx: { icon: FileText, gradient: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/20' },
    pptx: { icon: Presentation, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/20' },
    youtube: { icon: Video, gradient: 'from-pink-500 to-fuchsia-600', shadow: 'shadow-pink-500/20' },
    website: { icon: Globe, gradient: 'from-teal-400 to-cyan-500', shadow: 'shadow-cyan-500/20' },
};
const DEFAULT_TYPE_STYLE = { icon: FileText, gradient: 'from-primary to-blue-400', shadow: 'shadow-primary-shadow' };

// Helper function to format file size
const formatFileSize = (bytes) => {
    if (bytes === undefined || bytes === null) return 'N/A';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
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

    return (
        <div className='relative group bg-bg-card border border-border-medium/50 rounded-2xl p-5 flex flex-col gap-4 cursor-pointer shadow-sm hover:shadow-md hover:border-border-medium transition-all duration-200 overflow-hidden' onClick={handleNavigate}>
            {/* Delete action, pinned to the card's corner */}
            <button
                onClick={handleDelete}
                className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center bg-bg-card border border-border-light text-text-muted hover:text-error hover:bg-error-bg shadow-sm transition-all duration-150 opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="Delete document"
            >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            </button>

            {/* Header Section */}
            <div className="flex flex-col gap-3">
                <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${typeStyle.gradient} flex items-center justify-center shadow-sm ${typeStyle.shadow} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                    <TypeIcon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>

                {/* Title Section */}
                <div className='min-w-0' title={document.title}>
                    <h3 className="text-sm font-semibold text-text-heading leading-snug line-clamp-2">
                        {document.title}
                    </h3>
                </div>

                {/* Document Info */}
                <div className='flex items-center gap-1.5'>
                    {document.fileType && (
                        <span className='text-xs text-text-muted font-semibold bg-border-light px-2 py-0.5 rounded-md uppercase'>{document.fileType}</span>
                    )}
                    {document.fileSize !== undefined && (
                        <>
                            <span className='text-xs text-text-muted font-medium bg-border-light px-2 py-0.5 rounded-md'>{formatFileSize(document.fileSize)}</span>
                        </>
                    )}
                </div>

                {/* Stats section*/}
                <div className='flex items-center gap-3'>
                    {document.flashcardCount != undefined && (
                        <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-lg">
                            <BookOpen className='w-3.5 h-3.5 text-violet-400' strokeWidth={2} />
                            <span className='text-xs font-semibold text-violet-600 dark:text-violet-400'>{document.flashcardCount} Flashcards</span>
                        </div>
                    )}
                    {document.quizCount != undefined && (
                        <div className='flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg'>
                            <BrainCircuit className='w-3.5 h-3.5 text-emerald-400' strokeWidth={2} />
                            <span className='text-xs font-semibold text-emerald-600 dark:text-emerald-400'>{document.quizCount} Quizzes</span>
                        </div>
                    )}
                </div>

                {/* Learning path progress */}
                {document.learningPathProgress != null && (() => {
                    const band = getProgressBandStyle(document.learningPathProgress);
                    return (
                        <div className='flex items-center gap-2.5'>
                            <Target className={`w-3.5 h-3.5 shrink-0 ${band.text}`} strokeWidth={2} />
                            <div className='flex-1 h-1.5 bg-border-light rounded-full overflow-hidden'>
                                <div
                                    className={`h-full rounded-full ${band.bar} transition-all duration-300`}
                                    style={{ width: `${document.learningPathProgress}%` }}
                                />
                            </div>
                            <span className={`text-xs font-semibold tabular-nums shrink-0 ${band.text}`}>
                                {document.learningPathProgress}%
                            </span>
                        </div>
                    );
                })()}
            </div>

            {/*Footer Section */}
            <div className='mt-auto pt-3 border-t border-border-light flex items-center justify-between gap-2'>
                <div className='flex items-center gap-1.5 min-w-0'>
                    <Clock className='w-3.5 h-3.5 text-text-muted shrink-0' strokeWidth={2} />
                    <span className='text-xs text-text-muted truncate'>Uploaded {moment(document.lastAccessed).fromNow()}</span>
                </div>
                <ArrowRight className='w-3.5 h-3.5 text-text-muted shrink-0 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5' strokeWidth={2} />
            </div>

            {/*Hover Indicator*/}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r ${typeStyle.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left`} />
        </div>
    )
};

export default DocumentCard;