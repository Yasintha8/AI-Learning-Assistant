import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, BookOpen, BrainCircuit, Clock, Video, Globe, Presentation, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import moment from 'moment';

const FILE_TYPE_ICONS = {
    youtube: Video,
    website: Globe,
    pptx: Presentation,
};

const STATUS_STYLES = {
    ready: { label: 'Ready', icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
    processing: { label: 'Processing', icon: Loader2, bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', spin: true },
    pending: { label: 'Pending', icon: Loader2, bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', spin: true },
    error: { label: 'Error', icon: AlertCircle, bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400' },
};

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

    const TypeIcon = FILE_TYPE_ICONS[document.fileType] || FileText;
    const statusStyle = STATUS_STYLES[document.status];
    const StatusIcon = statusStyle?.icon;

    return (
        <div className='relative group bg-bg-card border border-border-medium/50 rounded-2xl p-5 flex flex-col gap-4 cursor-pointer shadow-sm hover:shadow-md hover:border-border-medium transition-all duration-200 overflow-hidden' onClick={handleNavigate}>
            {/* Header Section */}
            <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-linear-to-br from-primary to-blue-400 flex items-center justify-center shadow-sm shadow-primary-shadow shrink-0">
                        <TypeIcon className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        {statusStyle && (
                            <div className={`flex items-center gap-1 ${statusStyle.bg} px-2 py-1 rounded-lg`}>
                                <StatusIcon className={`w-3 h-3 ${statusStyle.text} ${statusStyle.spin ? 'animate-spin' : ''}`} strokeWidth={2.5} />
                                <span className={`text-[10px] font-semibold ${statusStyle.text}`}>{statusStyle.label}</span>
                            </div>
                        )}
                        <button
                            onClick={handleDelete}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-error hover:bg-error-bg transition-colors duration-150 opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                    </div>
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
            </div>

            {/*Footer Section */}
            <div className='mt-auto pt-3 border-t border-border-light'>
                <div className='flex items-center gap-1.5'>
                    <Clock className='w-3.5 h-3.5 text-text-muted' strokeWidth={2} />
                    <span className='text-xs text-text-muted'>Uploaded {moment(document.lastAccessed).fromNow()}</span>
                </div>
            </div>

            {/*Hover Indicator*/}
            <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary to-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left' />
        </div>
    )
};

export default DocumentCard;