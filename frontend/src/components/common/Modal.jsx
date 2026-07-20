import React from "react";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, title, headerAction, children }) => {

    if (!isOpen) return null;

    return <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="relative w-full max-w-md">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="relative bg-bg-card border border-border-light rounded-2xl shadow-xl flex flex-col overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-body hover:bg-border-light transition-colors duration-150 cursor-pointer"
                >
                    <X className="w-4 h-4" strokeWidth={2} />
                </button>

                <div className="px-6 pt-6 pb-4 border-b border-border-light pr-12 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-text-heading tracking-tight">
                        {title}
                    </h3>
                    {headerAction}
                </div>

                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    </div>
};

export default Modal;