import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    icon?: React.ReactNode;
    loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-600/20 border border-transparent',
    secondary: 'bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-slate-100 border border-transparent',
    outline: 'bg-transparent border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-800',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-transparent',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white shadow-sm shadow-danger-600/20 border border-transparent',
};

const sizeClasses: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
};

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    icon,
    loading,
    disabled,
    className = '',
    children,
    ...rest
}) => {
    return (
        <button
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...rest}
        >
            {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : icon}
            {children}
        </button>
    );
};

export default Button;
