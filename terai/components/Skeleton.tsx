import React from 'react';

interface SkeletonProps {
    className?: string;
    count?: number;
    height?: string | number;
    width?: string | number;
    circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = "",
    count = 1,
    height,
    width,
    circle = false
}) => {
    const skeletons = Array(count).fill(0);

    return (
        <>
            {skeletons.map((_, index) => (
                <div
                    key={index}
                    className={`
            animate-pulse bg-slate-200/80 rounded-xl
            ${circle ? 'rounded-full' : ''}
            ${className}
          `}
                    style={{
                        height: height,
                        width: width,
                    }}
                />
            ))}
        </>
    );
};

export const CardSkeleton = () => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <Skeleton width={180} height={24} />
                <Skeleton width={120} height={16} />
            </div>
            <Skeleton width={40} height={40} circle />
        </div>
        <div className="space-y-2 pt-4">
            <Skeleton count={3} height={14} className="mb-2" />
        </div>
        <div className="pt-4 flex gap-2">
            <Skeleton width={80} height={24} />
            <Skeleton width={80} height={24} />
        </div>
    </div>
);

export const TableRowSkeleton = () => (
    <div className="flex items-center gap-4 p-4 border-b border-slate-50">
        <Skeleton width={40} height={40} circle />
        <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={16} />
            <Skeleton width="20%" height={12} />
        </div>
        <Skeleton width={100} height={32} />
    </div>
);
