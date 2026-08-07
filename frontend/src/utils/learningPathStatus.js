import { Circle, Clock, CheckCircle2, AlertTriangle, Sprout, TrendingUp, Award, Brain, SearchCode, Lightbulb, BookMarked, Puzzle } from 'lucide-react';

// Shared status -> visual style mapping used by the Learning Path page and Dashboard card
export const STATUS_STYLES = {
    'not-started': {
        label: 'Not Started',
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        icon: Circle,
    },
    'in-progress': {
        label: 'In Progress',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        dot: 'bg-blue-400',
        icon: Clock,
    },
    mastered: {
        label: 'Mastered',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        dot: 'bg-emerald-400',
        icon: CheckCircle2,
    },
    weak: {
        label: 'Needs Review',
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-200',
        dot: 'bg-rose-400',
        icon: AlertTriangle,
    },
};

export const getStatusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES['not-started'];

// AI-detected knowledge level -> visual style, used once a topic has enough activity
// to be classified (see the Learning Path study plan feature)
export const KNOWLEDGE_LEVEL_STYLES = {
    beginner: {
        label: 'Beginner',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        icon: Sprout,
    },
    intermediate: {
        label: 'Intermediate',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        icon: TrendingUp,
    },
    proficient: {
        label: 'Proficient',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        icon: Award,
    },
};

export const getKnowledgeLevelStyle = (knowledgeLevel) => KNOWLEDGE_LEVEL_STYLES[knowledgeLevel] || null;

// Cognitive skill category behind a weak concept (which kind of thinking tripped the student
// up - not just which topic) -> visual style, used on the Weak Areas list
export const SKILL_CATEGORY_STYLES = {
    logical: {
        label: 'Logical Reasoning',
        bg: 'bg-violet-50',
        text: 'text-violet-600',
        border: 'border-violet-200',
        icon: Brain,
    },
    analytical: {
        label: 'Analytical Thinking',
        bg: 'bg-cyan-50',
        text: 'text-cyan-600',
        border: 'border-cyan-200',
        icon: SearchCode,
    },
    conceptual: {
        label: 'Conceptual Understanding',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-200',
        icon: Lightbulb,
    },
    memory: {
        label: 'Memory & Recall',
        bg: 'bg-pink-50',
        text: 'text-pink-600',
        border: 'border-pink-200',
        icon: BookMarked,
    },
    application: {
        label: 'Applying Knowledge',
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-200',
        icon: Puzzle,
    },
};

export const getSkillCategoryStyle = (skillCategory) => SKILL_CATEGORY_STYLES[skillCategory] || null;

// Overall document/topic progress (0-100) -> visual style, used for mastery progress bars
// on the Learning Path page and document cards
export const getProgressBandStyle = (percentage) => {
    if (percentage >= 75) {
        return { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' };
    }
    if (percentage >= 40) {
        return { text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' };
    }
    return { text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' };
};