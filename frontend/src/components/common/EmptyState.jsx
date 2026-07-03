import React from 'react'
import { FileText, Plus } from 'lucide-react'

const EmptyState = ({ onActionClick, title, description, buttonText }) => {
    return (
        <div className="flex items-center justify-center py-16 px-6 border-2 border-dashed border-neutral-300 rounded-2xl">
            <div className="flex flex-col items-center text-center gap-4 max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-blue-400 flex items-center justify-center shadow-sm shadow-primary-shadow">
                    <FileText className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-text-heading tracking-tight">{title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{description}</p>
                </div>
                {buttonText && onActionClick && (
                    <button
                        onClick={onActionClick}
                        className="h-10 px-5 rounded-xl bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        {buttonText}
                    </button>
                )}
            </div>
        </div>
    )
}

export default EmptyState