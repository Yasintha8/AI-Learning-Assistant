import React, { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Sparkles, BookOpen, Lightbulb, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import aiService from "../../services/aiService";
import toast from '../../utils/toast';
import MarkdownRenderer from "../common/MarkdownRenderer";
import Modal from "../common/Modal";
import Spinner from "../common/Spinner";

const AIActions = () => {

    const { id: documentId } = useParams();
    const [loadingAction, setLoadingAction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [concept, setConcept] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);
    const modalContentRef = useRef(null);

    const handleGenerateSummary = async () => {
        setLoadingAction("summary");
        try {
            const { summary } = await aiService.generateSummary(documentId);
            setModalTitle("Generated Summary");
            setModalContent(summary);
            setIsModalOpen(true);
        } catch (error) {
            toast.error("Failed to generate summary.");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleExplainConcept = async (e) => {
        e.preventDefault();
        if (!concept.trim()) {
            toast.error("Please enter a concept to explain.");
            return;
        }
        setLoadingAction("explain");
        try {
            const { explanation } = await aiService.explainConcept(
                documentId,
                concept
            );
            setModalTitle(`Explanation of "${concept}"`);
            setModalContent(explanation);
            setIsModalOpen(true);
            setConcept("");
        } catch (error) {
            toast.error("Failed to explain concept.");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleDownloadPdf = async () => {
        const node = modalContentRef.current;
        if (!node) return;
        setIsDownloading(true);

        // Temporarily lift the scroll clipping so the full content is captured, not just the visible slice.
        const prevMaxHeight = node.style.maxHeight;
        const prevOverflow = node.style.overflowY;
        node.style.maxHeight = "none";
        node.style.overflowY = "visible";

        try {
            const canvas = await html2canvas(node, {
                scale: 2,
                backgroundColor: "#ffffff",
            });
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = (modalTitle || "document").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
            pdf.save(`${fileName}.pdf`);
        } catch (error) {
            toast.error("Failed to download PDF.");
        } finally {
            node.style.maxHeight = prevMaxHeight;
            node.style.overflowY = prevOverflow;
            setIsDownloading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col h-full bg-bg-card border border-border-light rounded-2xl overflow-hidden shadow-xs">
                {/* Header */}
                <div className="px-5 py-4 border-b border-border-light">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-blue-400 flex items-center justify-center shrink-0 shadow-sm shadow-primary-shadow">
                            <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text-heading tracking-tight">
                                AI Assistant
                            </h3>
                            <p className="text-xs text-text-muted">Powered by advanced AI</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 p-4">
                    {/* Generate Summary */}
                    <div className="bg-bg-main border border-border-light rounded-xl p-4 flex items-center justify-between gap-4 hover:border-border-medium transition-colors duration-150">
                        <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                <BookOpen
                                    className="w-3.5 h-3.5 text-violet-500"
                                    strokeWidth={2}
                                />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-text-heading">
                                    Generate Summary
                                </h4>
                                <p className="text-xs text-text-muted leading-relaxed">
                                    Get a concise summary of the entire document.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerateSummary}
                            disabled={loadingAction === "summary"}
                            className="shrink-0 h-9 px-4 rounded-lg bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loadingAction === "summary" ? (
                                <span className="inline-flex items-center gap-2">
                                    <Spinner size="xs" tone="white" inline />
                                    Loading...
                                </span>
                            ) : (
                                "Summarize"
                            )}
                        </button>
                    </div>

                    {/* Explain Concept */}
                    <div className="bg-bg-main border border-border-light rounded-xl p-4 flex flex-col gap-3 hover:border-border-medium transition-colors duration-150">
                        <form onSubmit={handleExplainConcept} className="flex flex-col gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                    <Lightbulb
                                        className="w-3.5 h-3.5 text-amber-500"
                                        strokeWidth={2}
                                    />
                                </div>
                                <h4 className="text-sm font-semibold text-text-heading">
                                    Explain a Concept
                                </h4>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Enter a topic or concept from the document to get a detailed
                                explanation.
                            </p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={concept}
                                    onChange={(e) => setConcept(e.target.value)}
                                    placeholder="e.g., 'AI Learning'"
                                    className="flex-1 h-9 px-3 rounded-lg border border-border-medium bg-bg-card text-sm text-text-body placeholder:text-text-placeholder hover:border-primary focus:outline-none  focus:border-primary transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loadingAction === "explain"}
                                />
                                <button
                                    type="submit"
                                    disabled={loadingAction === "explain" || !concept.trim()}
                                    className="shrink-0 h-9 px-4 rounded-lg bg-linear-to-r from-primary to-blue-400 hover:from-primary-hover hover:to-cyan-400 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-primary-shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {loadingAction === "explain" ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Spinner size="xs" tone="white" inline />
                                            Loading...
                                        </span>
                                    ) : (
                                        "Explain"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Result Modal */}
                    <Modal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        title={modalTitle}
                        headerAction={
                            <button
                                onClick={handleDownloadPdf}
                                disabled={isDownloading}
                                className="shrink-0 h-8 px-3 rounded-lg border border-border-medium hover:border-primary hover:text-primary text-text-body text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isDownloading ? (
                                    <Spinner size="xs" tone="current" inline />
                                ) : (
                                    <Download className="w-3.5 h-3.5" strokeWidth={2} />
                                )}
                                PDF
                            </button>
                        }
                    >
                        <div
                            ref={modalContentRef}
                            className="max-h-[60vh] overflow-y-auto prose prose-sm max-w-none prose-slate bg-white p-1"
                        >
                            <MarkdownRenderer content={modalContent} />
                        </div>
                    </Modal>
                </div>
            </div>
        </>
    )
}

export default AIActions;