import jsPDF from 'jspdf';

// Text-only labels for study-plan/weak-concept actions (mirrors ACTION_META in
// LearningPathPage.jsx, kept separate here since this file has no JSX/icons)
const ACTION_LABELS = {
    'reread-summary': 'Re-read Summary',
    'redo-flashcards': 'Redo Flashcards',
    'retake-quiz': 'Retake Quiz',
    'ask-ai-explain': 'Ask AI to Explain',
};

const STATUS_LABELS = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    mastered: 'Mastered',
    weak: 'Needs Review',
};

// Text-only labels for weak-concept skill categories (mirrors SKILL_CATEGORY_STYLES in
// learningPathStatus.js, kept separate here since this file has no JSX/icons)
const SKILL_CATEGORY_LABELS = {
    logical: 'Logical Reasoning',
    analytical: 'Analytical Thinking',
    conceptual: 'Conceptual Understanding',
    memory: 'Memory & Recall',
    application: 'Applying Knowledge',
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
    heading: [15, 23, 42],
    body: [51, 65, 85],
    muted: [100, 116, 139],
    primary: [37, 99, 235],
    border: [226, 232, 240],
    emerald: [16, 185, 129],
    amber: [245, 158, 11],
    rose: [225, 29, 72],
};

const bandColorFor = (percentage) => {
    if (percentage >= 75) return COLORS.emerald;
    if (percentage >= 40) return COLORS.primary;
    return COLORS.amber;
};

// A concise, curated PDF report of a document's learning path progress - deliberately
// leaves out verbose per-topic AI reasoning, raw quiz Q&A, and other page-only detail,
// keeping only what a learner (or someone they share it with) actually needs at a glance.
export const generateLearningPathReportPdf = ({ documentTitle, userName, learningPath, weakAreasEligibility, recentQuizResults }) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = MARGIN;

    const ensureSpace = (needed) => {
        if (y + needed > PAGE_HEIGHT - MARGIN) {
            doc.addPage();
            y = MARGIN;
        }
    };

    const setColor = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

    const sectionTitle = (title) => {
        ensureSpace(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        setColor(COLORS.heading);
        doc.text(title, MARGIN, y);
        y += 2;
        doc.setDrawColor(...COLORS.border);
        doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
        y += 7;
    };

    const wrappedText = (text, x, maxWidth, fontSize, color, lineHeight = 4.6) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        setColor(color);
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line) => {
            ensureSpace(lineHeight);
            doc.text(line, x, y);
            y += lineHeight;
        });
    };

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(COLORS.primary);
    doc.text('AI LEARNING ASSISTANT', MARGIN, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    setColor(COLORS.heading);
    doc.text('Learning Path Report', MARGIN, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    setColor(COLORS.body);
    doc.text(documentTitle || 'Untitled Document', MARGIN, y);
    y += 6;

    doc.setFontSize(9);
    setColor(COLORS.muted);
    const generatedLine = `Generated ${new Date().toLocaleDateString()}${userName ? ` for ${userName}` : ''}`;
    doc.text(generatedLine, MARGIN, y);
    y += 10;

    // --- Overall progress ---
    const topics = learningPath.topics || [];
    const overallProgress = topics.length > 0
        ? Math.round(topics.reduce((sum, t) => sum + t.masteryScore, 0) / topics.length)
        : 0;
    const masteredCount = topics.filter((t) => t.status === 'mastered').length;
    const band = bandColorFor(overallProgress);

    sectionTitle('Overall Progress');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    setColor(band);
    doc.text(`${overallProgress}%`, MARGIN, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(COLORS.muted);
    doc.text(`${masteredCount} of ${topics.length} topic${topics.length === 1 ? '' : 's'} mastered`, MARGIN, y + 12);

    const barX = MARGIN + 45;
    const barWidth = CONTENT_WIDTH - 45;
    const barY = y + 3;
    doc.setFillColor(...COLORS.border);
    doc.roundedRect(barX, barY, barWidth, 4, 2, 2, 'F');
    doc.setFillColor(...band);
    doc.roundedRect(barX, barY, Math.max((barWidth * overallProgress) / 100, 4), 4, 2, 2, 'F');

    y += 20;

    // --- Topic summary table ---
    if (topics.length > 0) {
        sectionTitle('Topic Summary');

        const col1 = MARGIN; // title
        const col2 = MARGIN + 110; // status
        const col3 = MARGIN + 155; // mastery

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        setColor(COLORS.muted);
        doc.text('TOPIC', col1, y);
        doc.text('STATUS', col2, y);
        doc.text('MASTERY', col3, y);
        y += 2;
        doc.setDrawColor(...COLORS.border);
        doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
        y += 5.5;

        [...topics]
            .sort((a, b) => a.masteryScore - b.masteryScore)
            .forEach((topic) => {
                ensureSpace(7);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9.5);
                setColor(COLORS.body);
                const titleLines = doc.splitTextToSize(topic.title, col2 - col1 - 4);
                doc.text(titleLines[0], col1, y);

                setColor(COLORS.muted);
                doc.text(STATUS_LABELS[topic.status] || topic.status, col2, y);

                setColor(bandColorFor(topic.masteryScore));
                doc.setFont('helvetica', 'bold');
                doc.text(`${topic.masteryScore}%`, col3, y);

                y += 6.5;
            });

        y += 4;
    }

    // --- Weak areas (only once unlocked, mirrors the page's own gating) ---
    if (weakAreasEligibility?.eligible && learningPath.weakConcepts?.length > 0) {
        sectionTitle(`Weak Areas (based on ${recentQuizResults?.length || 0} quiz result${recentQuizResults?.length === 1 ? '' : 's'})`);

        learningPath.weakConcepts.forEach((concept) => {
            ensureSpace(14);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            setColor(COLORS.heading);
            const skillLabel = SKILL_CATEGORY_LABELS[concept.skillCategory];
            doc.text(`• ${concept.concept}${skillLabel ? ` (${skillLabel})` : ''}`, MARGIN, y);
            y += 5;

            if (concept.description) {
                wrappedText(concept.description, MARGIN + 4, CONTENT_WIDTH - 4, 9, COLORS.body);
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            setColor(COLORS.muted);
            const actionLabel = ACTION_LABELS[concept.action] || concept.action;
            doc.text(`Suggested: ${actionLabel}`, MARGIN + 4, y);
            y += 7;
        });

        y += 2;
    }

    // --- Study plan snapshot ---
    if (learningPath.studyPlan?.length > 0) {
        sectionTitle('Study Plan');

        learningPath.studyPlan.forEach((item, index) => {
            ensureSpace(7);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            setColor(COLORS.heading);
            doc.text(`${index + 1}. ${item.title}`, MARGIN, y);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            setColor(COLORS.muted);
            const actionLabel = ACTION_LABELS[item.action] || item.action;
            doc.text(actionLabel, PAGE_WIDTH - MARGIN, y, { align: 'right' });

            y += 6.5;
        });
    }

    // --- Footer page numbers ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i += 1) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setColor(COLORS.muted);
        doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
    }

    const fileName = (documentTitle || 'learning-path').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    doc.save(`${fileName}_learning_path_report.pdf`);
};