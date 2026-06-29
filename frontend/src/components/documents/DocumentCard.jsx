import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, BookOpen, BrainCircuit, Clock } from 'lucide-react';
import moment from 'moment';

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

    return (
        <div className='relative group bg-bg-card border border-border-medium rounded-2xl p-5 flex flex-col gap-4 cursor-pointer shadow-sm hover:shadow-md hover:border-border-medium transition-all duration-200 overflow-hidden' onClick={handleNavigate}>
            {/* Header Section */}
            <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-sm shadow-primary-shadow flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <button
                        onClick={handleDelete}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-error hover:bg-error-bg transition-colors duration-150 opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                </div>

                {/* Title Section */}
                <div className='min-w-0' title={document.title}>
                    <h3 className="text-sm font-semibold text-text-heading leading-snug line-clamp-2">
                        {document.title}
                    </h3>
                </div>

                {/* Document Info */}
                <div className='flex items-center gap-1.5'>
                    {document.fileSize !== undefined && (
                        <>
                            <span className='text-xs text-text-muted font-medium bg-border-light px-2 py-0.5 rounded-md'>{formatFileSize(document.fileSize)}</span>
                        </>
                    )}
                </div>

                {/* Stats section*/}
                <div className='flex items-center gap-3'>
                    {document.flashcardCount != undefined && (
                        <div className="flex items-center gap-1.5 bg-violet-50 px-2.5 py-1 rounded-lg">
                            <BookOpen className='w-3.5 h-3.5 text-violet-400' strokeWidth={2} />
                            <span className='text-xs font-semibold text-violet-600'>{document.flashcardCount} Flashcards</span>
                        </div>
                    )}
                    {document.quizCount != undefined && (
                        <div className='flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg'>
                            <BrainCircuit className='w-3.5 h-3.5 text-emerald-400' strokeWidth={2} />
                            <span className='text-xs font-semibold text-emerald-600'>{document.quizCount} Quizzes</span>
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
            <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left' />
        </div>
    )
};

export default DocumentCard;