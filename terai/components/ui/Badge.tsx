import React from 'react';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneClasses: Record<Tone, string> = {
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400',
    success: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500',
    warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500',
    danger: 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-500',
    info: 'bg-info-50 text-info-700 dark:bg-info-500/10 dark:text-info-500',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300',
};

interface BadgeProps {
    tone?: Tone;
    children: React.ReactNode;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children, className = '' }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${toneClasses[tone]} ${className}`}>
        {children}
    </span>
);

export default Badge;
