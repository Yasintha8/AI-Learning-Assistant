import { Circle, Clock, CheckCircle2, AlertTriangle, Sprout, TrendingUp, Award } from 'lucide-react';

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