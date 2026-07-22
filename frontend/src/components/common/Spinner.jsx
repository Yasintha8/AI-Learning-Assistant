import React from 'react';

const SIZE_PX = {
    xs: 14,
    sm: 16,
    md: 24,
    lg: 40,
};

const THICKNESS_PX = {
    xs: 2,
    sm: 2,
    md: 3,
    lg: 4,
};

const TONE_GRADIENTS = {
    primary: 'conic-gradient(from 0deg, transparent 0%, var(--color-primary) 55%, var(--color-primary-hover) 100%)',
    white: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.6) 55%, #ffffff 100%)',
    muted: 'conic-gradient(from 0deg, transparent 0%, var(--color-text-muted) 100%)',
    current: 'conic-gradient(from 0deg, transparent 0%, currentColor 100%)',
};

// A smooth conic-gradient "comet" ring, masked to a hollow circle so it reads
// as a modern loading indicator rather than a two-tone SVG arc.
const Spinner = ({ size = 'md', tone = 'primary', inline = false, label, className = '' }) => {
    const px = SIZE_PX[size] || SIZE_PX.md;
    const thickness = THICKNESS_PX[size] || THICKNESS_PX.md;
    const gradient = TONE_GRADIENTS[tone] || TONE_GRADIENTS.primary;

    const ringStyle = {
        width: px,
        height: px,
        background: gradient,
        WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 0)`,
        mask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 0)`,
    };

    const ring = (
        <span
            role="status"
            aria-label={label || 'Loading'}
            className={`inline-block shrink-0 rounded-full animate-spin ${className}`}
            style={ringStyle}
        />
    );

    if (inline) return ring;

    return (
        <div className="flex flex-col items-center justify-center gap-3 p-8">
            {ring}
            {label && (
                <p className="text-sm text-text-muted font-medium">{label}</p>
            )}
        </div>
    );
};

export default Spinner;