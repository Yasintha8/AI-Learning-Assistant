import React, { useEffect } from "react";
import { X } from "lucide-react";

const SIZE_CLASSES = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    "2xl": "max-w-3xl",
    "3xl": "max-w-5xl",
};

const Modal = ({
    isOpen,
    onClose,
    title,
    headerAction,
    children,
    size = "md",
}) => {
    // Keyboard navigation (Escape key to dismiss)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose?.();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent background scrolling while modal is open
    useEffect(() => {
        if (!isOpen) return;
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                className={`relative w-full ${sizeClass} bg-bg-card border border-border-light rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 my-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close modal"
                    className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-heading hover:bg-bg-main focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors duration-150 cursor-pointer"
                >
                    <X className="w-4.5 h-4.5" strokeWidth={2} />
                </button>

                <div className="px-6 pt-6 pb-4 border-b border-border-light pr-14 flex items-center justify-between gap-3">
                    <h3 id="modal-title" className="text-lg font-bold text-text-heading tracking-tight font-display">
                        {title}
                    </h3>
                    {headerAction}
                </div>

                <div className="px-6 py-5 max-h-[calc(85vh-8rem)] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;