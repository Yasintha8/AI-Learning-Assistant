import { Circle, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

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