import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({ padding = 'md', className = '', children, ...rest }) => (
    <div className={`card ${paddingClasses[padding]} ${className}`} {...rest}>
        {children}
    </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...rest }) => (
    <div className={`flex items-center justify-between mb-4 ${className}`} {...rest}>
        {children}
    </div>
);

export default Card;
